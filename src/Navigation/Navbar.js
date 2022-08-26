import React from 'react';
import Button from 'react-bootstrap/Button';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import withRouter from '../withRouter.js';
import './Navbar.css';

class CustomNavbar extends React.Component {
	render() {
		return (
			<div>
				<link href="https://cdn.jsdelivr.net/gh/hung1001/font-awesome-pro-v6@18657a9/css/all.min.css" rel="stylesheet" type="text/css" />
				<Navbar>
					<Container>
						<Navbar.Brand
							href="/dashboard"
							className={this.props.theme === 'dark' && 'text-light'}
							onClick={event => {
								event.preventDefault();
								this.props.navigate('/dashboard');
							}}>
							Quaver
						</Navbar.Brand>
						<Navbar.Toggle />
						<Navbar.Collapse className="justify-content-end">
							<Button
								variant={this.props.theme === 'light' ? 'dark' : 'light'}
								className="me-2"
								onMouseDown={event => event.preventDefault()}
								onClick={event => this.props.toggleTheme()}>
								<i className={`fa-solid ${this.props.theme === 'light' ? 'fa-moon' : 'fa-sun-bright'} fa-fw`}></i>
							</Button>
							<DropdownButton
								title={<div>
									<img
										src={`https://cdn.discordapp.com/${this.props.user.avatar ? '' : 'embed/'}avatars/${this.props.user.avatar ? `${this.props.user.id}/${this.props.user.avatar}` : this.props.user.discriminator % 5}.png`}
										alt="Profile"
										className="profile-picture" />
									{`${this.props.user.username}#${this.props.user.discriminator}`}
								</div>}
								variant={this.props.theme === 'dark' ? 'light' : 'dark'}
								menuVariant={this.props.theme === 'dark' ? undefined : 'dark'}
								onMouseDown={event => event.preventDefault()}>
								<Dropdown.Item
									href="/logout"
									onClick={event => {
										event.preventDefault();
										this.props.removeCookie('token');
										window.location.href = '/';
									}}>
									Log out
								</Dropdown.Item>
							</DropdownButton>
						</Navbar.Collapse>
					</Container>
				</Navbar>
			</div>
		);
	}
}

export default withRouter(CustomNavbar);
