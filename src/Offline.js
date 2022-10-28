import React from "react";
import Button from "react-bootstrap/Button";
import './App.css';

class Offline extends React.Component {
	render() {
		return (
			<div className='loader-container loader-container-dark'>
				<h3 className='front'>Connection Error</h3>
				<h5 className='front'>There was an error connecting to Quaver.</h5>
				<br></br>
				<Button variant="light" href="/">Try again</Button>
			</div>
		);
	}
}

export default Offline;
