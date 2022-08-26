import { io } from "socket.io-client";
import React from "react";
import './App.css';
import withRouter from "./withRouter.js";
import Button from "react-bootstrap/Button";
import { Navigate } from "react-router-dom";

const redirectURI = `${window.location.protocol}//${window.location.host}`;
const authorizationLink = `https://discord.com/api/oauth2/authorize?client_id=${process.env.REACT_APP_DISCORD_CLIENT_ID}&redirect_uri=${redirectURI}&response_type=code&scope=identify%20guilds&prompt=none`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      msg:
      <>
        <div className='loader-container'>
          <h3 className='loading'>Loading...</h3>
        </div>
      </>
    };
  }

  componentDidMount() {
    const socket = io(process.env.REACT_APP_WEBSOCKET_HOST);
    socket.on('connect_error', () => {
      this.setState({
        msg:
        <>
          <div className='loader-container'>
            <h3 className='loading'>Loading...</h3>
          </div>
          <Navigate to='/offline'></Navigate>
        </>
      });
    });
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code && !this.props.cookies.token) {
      this.setState({
        msg:
        <>
          <link href="https://cdn.jsdelivr.net/gh/hung1001/font-awesome-pro-v6@18657a9/css/all.min.css" rel="stylesheet" type="text/css" />
          <div className='loader-container'>
            <h3 className='front'>Quaver</h3>
            <Button size="lg" variant="light" href={authorizationLink}><i className="fa-brands fa-discord fa-fw"></i> Login with Discord</Button>
          </div>
        </>
      });
      return;
    }
    if (code) {
      socket.emit('exchange', [code, redirectURI], response => {
        if (response.status !== 'success') window.location.href = '/';
        else {
          this.props.setCookie('token', response.encryptedToken, { path: '/' });
          this.setState({
            msg:
            <>
              <div className='loader-container'>
                <h3 className='loading'>Loading...</h3>
              </div>
              <Navigate to='/dashboard'></Navigate>
            </>
          });
        }
      });
    }
    else {
      this.setState({
        msg:
        <>
          <div className='loader-container'>
            <h3 className='loading'>Loading...</h3>
          </div>
          <Navigate to='/dashboard'></Navigate>
        </>
      });
    }
  }

  render() {
    return this.state.msg;
  }
}

export default withRouter(App);
