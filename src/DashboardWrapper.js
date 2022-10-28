import $ from 'jquery';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { io } from "socket.io-client";
import Dashboard from './Dashboard.js';
import Navbar from './Navigation/Navbar.js';
import withRouter from './withRouter.js';

class DashboardWrapper extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			msg: (
				<>
					<div className='loader-container'>
						<h3 className='loading'>Loading...</h3>
					</div>
				</>
			),
			theme: this.props.cookies.theme ?? 'light',
		};
		if (this.props.cookies.theme === 'dark') $('body').addClass('dark-bg');
		this.props.setCookie('theme', this.state.theme, { path: '/' });
		this.toggleTheme = this.toggleTheme.bind(this);
	}

	toggleTheme() {
		const updatedTheme = this.state.theme === 'light' ? 'dark' : 'light';
		this.setState({ theme: updatedTheme });
		$('body').toggleClass('dark-bg');
		this.props.setCookie('theme', updatedTheme, { path: '/' });
	}

	componentDidMount() {
		if (!this.props.cookies.token) {
			this.setState({ msg: <Navigate to='/'></Navigate> });
			return;
		}
		if (this.props.cookies.destination) {
			this.props.removeCookie('destination');
			this.setState({ msg: <Navigate to={`/guild/${this.props.cookies.destination}`}></Navigate> });
			return;
		}
		const socket = io(process.env.REACT_APP_WEBSOCKET_HOST);
		socket.on('connect_error', () => this.setState({ msg: <Navigate to='/offline'></Navigate> }));
		socket.emit('fetchuser', [this.props.cookies.token], response => {
			if (response.status !== 'success') {
			  	this.props.removeCookie('token');
			  	this.setState({ msg: <Navigate to='/'></Navigate> });
			  	return;
			}
			this.setState({ user: response.user });
			socket.emit('fetchguilds', [this.props.cookies.token], rsp => {
				if (rsp.status !== 'success') {
					this.props.removeCookie('token');
					this.setState({ msg: <Navigate to='/'></Navigate> });
					return;
				}
				const guilds = rsp.guilds;
				guilds.sort((a, b) => {
					if (a.botInGuild && !b.botInGuild) return -1;
					if (b.botInGuild && !a.botInGuild) return 1;
					if ((a.permissions & 0x20) !== 0 && (b.permissions & 0x20) === 0) return -1;
					if ((b.permissions & 0x20) !== 0 && (a.permissions & 0x20) === 0) return 1;
					return a.name.localeCompare(b.name);
				});
				this.setState({ guilds, version: rsp.version, msg: null });
			});
		});
	}

	render() {
		return this.state.msg ?? (
			<>
				<Navbar theme={this.state.theme} toggleTheme={this.toggleTheme} user={this.state.user} />
				<Dashboard theme={this.state.theme} guilds={this.state.guilds} version={this.state.version} />
			</>
		)
	}
}

export default withRouter(DashboardWrapper);
