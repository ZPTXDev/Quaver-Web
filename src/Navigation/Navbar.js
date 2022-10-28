import { MDBBtn, MDBContainer, MDBDropdown, MDBDropdownItem, MDBDropdownMenu, MDBDropdownToggle, MDBNavbar, MDBNavbarBrand, MDBNavbarToggler } from 'mdb-react-ui-kit';
import React from 'react';
import withRouter from '../withRouter.js';
import './Navbar.css';

class CustomNavbar extends React.Component {
	render() {
		return (
			<div>
				<link href="https://cdn.jsdelivr.net/gh/hung1001/font-awesome-pro-v6@18657a9/css/all.min.css" rel="stylesheet" type="text/css" />
				<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
				<link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/5.0.0/mdb.min.css" rel="stylesheet" />
				<script
					type="text/javascript"
					src="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/5.0.0/mdb.min.js"
				></script>
				<MDBNavbar bgColor={this.props.theme === 'dark' ? 'gray' : 'light'} className="mb-2">
					<MDBContainer>
						<MDBNavbarBrand
							href="/dashboard"
							className={`text-${this.props.theme === 'dark' ? 'light' : 'dark'}`}
							onClick={event => {
								event.preventDefault();
								this.props.navigate('/dashboard');
							}}>
							Quaver
						</MDBNavbarBrand>
						<MDBNavbarToggler />
						<div className="d-flex justify-content-end">
							<MDBBtn
								floating
								color={this.props.theme === 'dark' ? 'light' : 'gray'}
								className={`me-2 text-${this.props.theme}`}
								onMouseDown={event => event.preventDefault()}
								onClick={event => this.props.toggleTheme()}>
								<i className={`fa-solid ${this.props.theme === 'light' ? 'fa-moon' : 'fa-sun-bright'} fa-fw`}></i>
							</MDBBtn>
							<MDBDropdown>
								<MDBDropdownToggle
									color={this.props.theme === 'dark' ? 'light' : 'gray'}
									className={`text-${this.props.theme}`}
									onMouseDown={event => event.preventDefault()}>
									{`${this.props.user.username}#${this.props.user.discriminator}`}
								</MDBDropdownToggle>
								<MDBDropdownMenu dark={this.props.theme !== 'dark'}>
									<MDBDropdownItem
										link="/logout"
										onClick={event => {
											event.preventDefault();
											this.props.removeCookie('token');
											window.location.href = '/';
										}}>
										Log out
									</MDBDropdownItem>
								</MDBDropdownMenu>
							</MDBDropdown>
						</div>
					</MDBContainer>
				</MDBNavbar>
			</div>
		);
	}
}

export default withRouter(CustomNavbar);
