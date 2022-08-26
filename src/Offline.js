import React from "react";
import './App.css';
import Button from "react-bootstrap/Button";

class Offline extends React.Component {
	render() {
		return (
			<div className='loader-container'>
				<h3 className='front'>Connection Error</h3>
				<h5 className='front'>There was an error connecting to Quaver.</h5>
				<br></br>
				<Button variant="light" href="/">Try again</Button>
			</div>
		);
	}
}

export default Offline;
