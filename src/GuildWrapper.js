import $ from 'jquery';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { io } from "socket.io-client";
import Guild from './Guild.js';
import Navbar from './Navigation/Navbar.js';
import withRouter from './withRouter.js';

class GuildWrapper extends React.Component {
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
            connected: false,
            queue: [],
            volume: 100,
            loop: 0,
            filters: {
                bassboost: false,
                nightcore: false,
            },
            paused: false,
            playing: {
                track: {},
                elapsed: 0,
                duration: 0,
                skip: {},
                nothingPlaying: true,
            },
            timeout: false,
            pauseTimeout: false,
            filterToast: false,
            mismatchToast: false,
            resumeToast: false,
		};
		if (this.props.cookies.theme === 'dark') $('body').addClass('dark-bg');
		this.props.setCookie('theme', this.state.theme, { path: '/' });
		this.toggleTheme = this.toggleTheme.bind(this);
        this.authorizationLink = `https://discord.com/api/oauth2/authorize?client_id=${process.env.REACT_APP_DISCORD_CLIENT_ID}&redirect_uri=${window.location.protocol}//${window.location.host}&response_type=code&scope=applications.commands%20bot&permissions=3459072&guild_id=`;
        this.socket = null;
        this.updatePlay = true;
        this.updateVolume = true;
        this.playRef = React.createRef();
        this.volumeRef = React.createRef();

        this.setLoop = this.setLoop.bind(this);
        this.setBassboost = this.setBassboost.bind(this);
        this.setNightcore = this.setNightcore.bind(this);
        this.setPaused = this.setPaused.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.seek = this.seek.bind(this);
        this.skip = this.skip.bind(this);
        this.remove = this.remove.bind(this);
        this.shuffle = this.shuffle.bind(this);
        this.setFilterToast = this.setFilterToast.bind(this);
        this.setMismatchToast = this.setMismatchToast.bind(this);
        this.setResumeToast = this.setResumeToast.bind(this);
        this.setPlaying = this.setPlaying.bind(this);
        this.setVolumeDisplay = this.setVolumeDisplay.bind(this);
        this.setUpdatePlay = this.setUpdatePlay.bind(this);
        this.setUpdateVolume = this.setUpdateVolume.bind(this);
    }

	toggleTheme() {
		const updatedTheme = this.state.theme === 'light' ? 'dark' : 'light';
		this.setState({ theme: updatedTheme });
		$('body').toggleClass('dark-bg');
		this.props.setCookie('theme', updatedTheme, { path: '/' });
	}

	componentDidMount() {
        if (!this.props.cookies.token) {
            this.props.setCookie('destination', this.props.params.id, { path: '/' });
			this.setState({ msg: <Navigate to='/'></Navigate> });
			return;
		}
		const socket = io(process.env.REACT_APP_WEBSOCKET_HOST);
        this.socket = socket;
		this.socket.on('connect_error', () => this.setState({ msg: <Navigate to='/offline'></Navigate> }));
		this.socket.emit('fetchuser', [this.props.cookies.token], response => {
			if (response.status !== 'success') {
			  	this.props.removeCookie('token');
			  	this.setState({ msg: <Navigate to='/'></Navigate> });
			  	return;
			}
			this.setState({ user: response.user });
			this.socket.emit('fetchguilds', [this.props.cookies.token], rsp => {
				if (rsp.status !== 'success') {
					this.props.removeCookie('token');
					this.setState({ msg: <Navigate to='/'></Navigate> });
					return;
				}
				const guild = rsp.guilds.find(g => g.id === this.props.params.id);
                if (!guild) {
                    this.setState({ msg: <Navigate to='/dashboard'></Navigate> });
                    return;
                }
                if (!guild.botInGuild) {
                    if ((guild.permissions & 0x20) !== 0) {
                        window.location.href = `${this.authorizationLink}${this.props.params.id}`;
                        return;
                    }
                    this.setState({ msg: <Navigate to='/dashboard'></Navigate> });
                    return;
                }
				this.setState({ guild, version: rsp.version });
                this.socket.emit('join', [this.props.params.id], joinCallback => {
                    if (joinCallback.status !== 'success') {
                        this.setState({ msg: <Navigate to='/dashboard'></Navigate> });
                        return;
                    }
                    this.socket.emit('request', [this.props.params.id, 'player'], requestCallback => {
                        if (requestCallback.status !== 'success') {
                            this.setState({ msg: <Navigate to='/dashboard'></Navigate> });
                            return;
                        }
                        this.setState({ msg: null });
                        if (requestCallback.response) this.setState({ ...requestCallback.response, connected: true });
                        this.socket.on('intervalTrackUpdate', playing => {
                            if (!this.updatePlay) return;
                            this.playRef.current.value = this.state.playing.nothingPlaying ? 0 : this.state.playing.elapsed / 1000;
                            this.setState({ playing, connected: true });
                        });
                        this.socket.on('queueUpdate', queue => this.setState({ queue }));
                        this.socket.on('filterUpdate', filters => this.setState({ filters }));
                        this.socket.on('loopUpdate', loop => this.setState({ loop }));
                        this.socket.on('pauseUpdate', paused => this.setState({ paused }));
                        this.socket.on('volumeUpdate', volume => {
                            if (!this.updateVolume) return;
                            this.volumeRef.current.value = volume;
                            this.setState({ volume });
                        });
                        this.socket.on('channelUpdate', channel => this.setState({ channel }));
                        this.socket.on('textChannelUpdate', textChannel => this.setState({ textChannel }));
                        this.socket.on('timeoutUpdate', timeout => {
                            if (this.state.timeout && !timeout) this.setState({ resumeToast: true });
                            this.setState({ timeout });
                        });
                        this.socket.on('pauseTimeoutUpdate', pauseTimeout => {
                            if (this.state.pauseTimeout && !pauseTimeout) this.setState({ resumeToast: true });
                            this.setState({ pauseTimeout });
                        });
                        this.socket.on('playerDisconnect', () => {
                            this.setState({
                                queue: [],
                                volume: 100,
                                loop: 0,
                                filters: {
                                    bassboost: false,
                                    nightcore: false,
                                },
                                paused: false,
                                playing: {
                                    track: {},
                                    elapsed: 0,
                                    duration: 0,
                                    skip: {},
                                    nothingPlaying: true,
                                },
                                timeout: false,
                                pauseTimeout: false,
                                connected: false,
                                channel: undefined,
                                textChannel: undefined,
                                filterToast: false,
                                mismatchToast: false,
                                resumeToast: false,
                            });
                        });
                    });
                });
			});
		});
	}

    setLoop(type) {
        this.socket.emit('update', [this.props.params.id, { type: 'loop', value: type }], r => {
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }

    setBassboost(value) {
        this.socket.emit('update', [this.props.params.id, { type: 'bassboost', value: value }], r => {
            if (r.status !== 'success') return this.setState({ mismatchToast: true });
            this.setState({ filterToast: true });
        });
    }

    setNightcore(value) {
        this.socket.emit('update', [this.props.params.id, { type: 'nightcore', value: value }], r => {
            if (r.status !== 'success') return this.setState({ mismatchToast: true });
            this.setState({ filterToast: true });
        });
    }

    setPaused(value) {
        this.socket.emit('update', [this.props.params.id, { type: 'paused', value: value }], r => {
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }

    setVolume(value) {
        this.socket.emit('update', [this.props.params.id, { type: 'volume', value: value }], r => {
            this.updateVolume = true;
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }

    seek(value) {
        this.socket.emit('update', [this.props.params.id, { type: 'seek', value: value }], r => {
            this.updatePlay = true;
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }

    skip() {
        this.socket.emit('update', [this.props.params.id, { type: 'skip' }], r => {
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }
        
    remove(value) {
        this.socket.emit('update', [this.props.params.id, { type: 'remove', value: value }], r => {
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }

    shuffle() {
        this.socket.emit('update', [this.props.params.id, { type: 'shuffle' }], r => {
            if (r.status !== 'success') this.setState({ mismatchToast: true });
        });
    }

    setFilterToast(value) {
        this.setState({ filterToast: value });
    }

    setMismatchToast(value) {
        this.setState({ mismatchToast: value });
    }

    setResumeToast(value) {
        this.setState({ resumeToast: value });
    }

    setPlaying(value) {
        this.setState({ playing: value });
    }

    setVolumeDisplay(value) {
        this.setState({ volume: value });
    }

    setUpdatePlay(value) {
        this.updatePlay = value;
    }

    setUpdateVolume(value) {
        this.updateVolume = value;
    }

	render() {
		return this.state.msg ?? (
			<>
				<Navbar theme={this.state.theme} toggleTheme={this.toggleTheme} user={this.state.user} />
				<Guild
                    theme={this.state.theme}
                    playRef={this.playRef}
                    volumeRef={this.volumeRef}
                    user={this.state.user}
                    guild={this.state.guild}
                    version={this.state.version}
                    connected={this.state.connected}
                    queue={this.state.queue}
                    volume={this.state.volume}
                    loop={this.state.loop}
                    filters={this.state.filters}
                    paused={this.state.paused}
                    playing={this.state.playing}
                    timeout={this.state.timeout}
                    pauseTimeout={this.state.pauseTimeout}
                    channel={this.state.channel}
                    textChannel={this.state.textChannel}
                    filterToast={this.state.filterToast}
                    mismatchToast={this.state.mismatchToast}
                    resumeToast={this.state.resumeToast}
                    setLoop={this.setLoop}
                    setBassboost={this.setBassboost}
                    setNightcore={this.setNightcore}
                    setPaused={this.setPaused}
                    setVolume={this.setVolume}
                    seek={this.seek}
                    skip={this.skip}
                    remove={this.remove}
                    shuffle={this.shuffle}
                    setFilterToast={this.setFilterToast}
                    setMismatchToast={this.setMismatchToast}
                    setResumeToast={this.setResumeToast}
                    setPlaying={this.setPlaying}
                    setVolumeDisplay={this.setVolumeDisplay}
                    setUpdatePlay={this.setUpdatePlay}
                    setUpdateVolume={this.setUpdateVolume}
                />
			</>
		)
	}
}

export default withRouter(GuildWrapper);
