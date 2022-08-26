import React from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Pagination from 'react-bootstrap/Pagination';
import withRouter from './withRouter.js';
import $ from 'jquery';
import './App.css';

const waitForFinalEvent = function () {
	const b = {};
	return function (c, d, a) {
		a || (a = 'I am a banana!');
		b[a] && clearTimeout(b[a]);
		b[a] = setTimeout(c, d);
	}
}();
var fullDateString = new Date();

class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			page: 1,
			breakpoint: this.getResponsiveBreakpoint(),
		};
	}

	numberToDisplay(breakpoint) {
		switch (breakpoint) {
			case 'xs':
			case 'sm':
			case 'md':
				return 4;
			default:
				return 10;
		}
	}

	paginate(arr, size) {
		return arr.reduce((acc, val, i) => {
			let idx = Math.floor(i / size);
			let page = acc[idx] || (acc[idx] = []);
			page.push(val);
			return acc;
		}, []);
	}

	/**
 	* Detect the current active responsive breakpoint in Bootstrap
	* @returns {string}
	* @author farside @link https://stackoverflow.com/users/4354249/farside
	*/
	getResponsiveBreakpoint() {
		const envs = { xs: 'd-none', sm: 'd-sm-none', md: 'd-md-none', lg: 'd-lg-none', xl: 'd-xl-none' };
		let env = '';
		const $el = $('<div>');
		$el.appendTo($('body'));
	
		for (let i = Object.keys(envs).length - 1; i >= 0; i--) {
				env = Object.keys(envs)[i];
				$el.addClass(envs[env]);
				if ($el.is(':hidden')) break;
		}
		$el.remove();
		return env;
	};

	componentDidMount() {
		$(window).on('resize', () => {
			waitForFinalEvent(() => {
				const breakpoint = this.getResponsiveBreakpoint();
				const pages = this.paginate(this.props.guilds, this.numberToDisplay(breakpoint)).length;
				if (this.state.page > pages) this.setState({ page: pages });
				this.setState({ breakpoint });
			}, 300, fullDateString.getTime());
		});
	}

	render() {
		return this.state.msg ?? (
			<>
				<Container>
					<Card body bg={this.props.theme} className="mb-2">
						<Breadcrumb className="remove-bottom-margin">
							<Breadcrumb.Item className={this.props.theme === 'dark' && 'text-light'} active>Dashboard</Breadcrumb.Item>
						</Breadcrumb>
					</Card>
					{this.props.guilds.length > 0
						? (
							<div>
								<Row xs={2} lg={5} className="g-2">
									{this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint))[this.state.page - 1].map(guild => 
											<Col key={guild.id}>
												<Card bg={this.props.theme} text={this.props.theme === 'dark' ? 'light' : 'dark'} className="h-100">
													<Card.Img
														variant="top"
														src={
															guild.icon
																? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
																: 'https://cdn.discordapp.com/embed/avatars/5.png'
														} />
													<Card.Body>
														<Card.Title className="truncate-text" style={{ lineHeight: 'normal' }} title={guild.name}>
															{guild.name}
														</Card.Title>
													</Card.Body>
													<Button
														className="m-1"
														variant={guild.botInGuild ? 'primary' : 'secondary'}
														href={`/guild/${guild.id}`}
														onMouseDown={event => event.preventDefault()}
														onClick={event => {
															event.preventDefault();
															this.props.navigate(`/guild/${guild.id}`);
														}}
														disabled={!guild.botInGuild && (guild.permissions & 0x20) === 0}>
														{guild.botInGuild ? 'Manage' : 'Add to Server'}
													</Button>
												</Card>
											</Col>
									)}
								</Row>
								<Pagination className="mt-2 justify-content-center">
									<Pagination.First
										onClick={() => this.setState({ page: 1 })}
										disabled={this.state.page === 1} />
									{this.state.page >= 3 && <Pagination.Ellipsis disabled />}
									{this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint))
										.map((page, i) =>
											<Pagination.Item
												key={i + 1}
												active={this.state.page === i + 1}
												onClick={() => this.setState({ page: i + 1 })}>
												{i + 1}
											</Pagination.Item>
										)
										.filter((page, i) =>
											[
												this.state.page - 1,
												this.state.page,
												this.state.page + 1,
												...[this.state.page === 1 && this.state.page + 2],
												...[this.state.page === this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length && this.state.page - 2]
											].includes(i + 1)
										)}
									{this.state.page <= this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length - 2 && <Pagination.Ellipsis disabled />}
									<Pagination.Last
										onClick={() => this.setState({ page: this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length })}
										disabled={this.state.page === this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length} />
								</Pagination>
							</div>
						)
						: (
							<Card>
								<Card.Body>
									<Card.Title>No servers to show</Card.Title>
									<Card.Text>
										You're either not in any servers, or something has gone terribly wrong.
									</Card.Text>
								</Card.Body>
							</Card>
						)
					}
				</Container>
				<footer className="py-3 my-4">
					<p className="text-center text-muted">Quaver Version: {this.props.version}</p>
				</footer>
			</>
		);
	}
}

export default withRouter(Dashboard);
