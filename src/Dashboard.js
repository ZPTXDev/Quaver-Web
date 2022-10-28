import $ from 'jquery';
import { MDBBreadcrumb, MDBBreadcrumbItem, MDBBtn, MDBCard, MDBCardBody, MDBCardImage, MDBCardTitle, MDBCol, MDBContainer, MDBPagination, MDBPaginationItem, MDBPaginationLink, MDBRow } from 'mdb-react-ui-kit';
import React from 'react';
import Card from 'react-bootstrap/Card';
import Pagination from 'react-bootstrap/Pagination';
import './App.css';
import withRouter from './withRouter.js';

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
				<MDBContainer>
					<MDBCard body background={this.props.theme === 'dark' ? 'gray' : 'light'} className="mb-2">
						<MDBBreadcrumb className="remove-bottom-margin m-3">
							<MDBBreadcrumbItem className={this.props.theme === 'dark' && 'text-light'} active>Dashboard</MDBBreadcrumbItem>
						</MDBBreadcrumb>
					</MDBCard>
					{this.props.guilds.length > 0
						? (
							<div>
								<MDBRow className="row-cols-xs-2 row-cols-lg-5 g-2">
									{this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint))[this.state.page - 1].map(guild => 
											<MDBCol key={guild.id}>
												<MDBCard alignment='center' background={this.props.theme === 'dark' ? 'gray' : 'light'} className={`h-100 text-${this.props.theme === 'dark' ? 'light' : 'dark'}`}>
													<MDBCardImage
														position="top"
														src={
															guild.icon
																? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
																: 'https://cdn.discordapp.com/embed/avatars/5.png'
														} />
													<MDBCardBody>
														<MDBCardTitle className="truncate-text" style={{ lineHeight: 'normal' }} title={guild.name}>
															{guild.name}
														</MDBCardTitle>
													</MDBCardBody>
													<MDBBtn
														className="m-1"
														color={guild.botInGuild ? 'primary' : 'secondary'}
														href={`/guild/${guild.id}`}
														onMouseDown={event => event.preventDefault()}
														onClick={event => {
															event.preventDefault();
															this.props.navigate(`/guild/${guild.id}`);
														}}
														disabled={!guild.botInGuild && (guild.permissions & 0x20) === 0}>
														{guild.botInGuild ? 'Manage' : 'Add to Server'}
													</MDBBtn>
												</MDBCard>
											</MDBCol>
									)}
								</MDBRow>
								<MDBPagination className="mt-2 mb-0 justify-content-center">
									<MDBPaginationItem disabled={this.state.page === 1} className={this.state.page === 1 ? 'pagination-disabled' : ''}>
										<MDBPaginationLink onClick={() => this.setState({ page: 1 })} href='#' aria-label='First' tabIndex={this.state.page === 1 ? -1 : 0} aria-disabled={this.state.page === 1}>
											<span aria-hidden='true'>«</span>
										</MDBPaginationLink>
									</MDBPaginationItem>
									{this.state.page >= 3 && <Pagination.Ellipsis disabled className="pagination-disabled" />}
									{this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint))
										.map((page, i) =>
											<MDBPaginationItem key={i + 1} active={this.state.page === i + 1} aria-current={this.state.page === i + 1 ? 'page' : ''}>
												<MDBPaginationLink
													onClick={() => this.setState({ page: i + 1 })}
													href={this.state.page === i + 1 ? undefined : '#'}>
													{i + 1}
												</MDBPaginationLink>
											</MDBPaginationItem>
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
									{this.state.page <= this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length - 2 && <Pagination.Ellipsis disabled className="pagination-disabled" />}
									<MDBPaginationItem disabled={this.state.page === this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length} className={this.state.page === this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length ? 'pagination-disabled' : ''}>
										<MDBPaginationLink onClick={() => this.setState({ page: this.paginate(this.props.guilds, this.numberToDisplay(this.state.breakpoint)).length })} href='#' aria-label='Last'>
											<span aria-hidden='true'>»</span>
										</MDBPaginationLink>
									</MDBPaginationItem>
								</MDBPagination>
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
				</MDBContainer>
				<footer className="py-3 my-4">
					<p className="text-center text-muted">Quaver Version: {this.props.version}</p>
				</footer>
			</>
		);
	}
}

export default withRouter(Dashboard);
