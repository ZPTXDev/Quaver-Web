import { MDBBadge, MDBBreadcrumb, MDBBreadcrumbItem, MDBBtn, MDBBtnGroup, MDBCard, MDBCardBody, MDBCardFooter, MDBCardHeader, MDBCardSubTitle, MDBCardText, MDBCardTitle, MDBCol, MDBContainer, MDBListGroup, MDBListGroupItem, MDBRow } from 'mdb-react-ui-kit';
import React from 'react';
import { Card, Form } from 'react-bootstrap';
import Alert from 'react-bootstrap/Alert';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import ReactTimeAgo from 'react-time-ago';
import './App.css';
import './Guild.css';
import withRouter from './withRouter.js';

class Guild extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.imgRef = React.createRef();
	}

	msToTime(milliseconds, format) {
		const total_seconds = parseInt(Math.floor(milliseconds / 1000));
		const total_minutes = parseInt(Math.floor(total_seconds / 60));
		const total_hours = parseInt(Math.floor(total_minutes / 60));
		const days = parseInt(Math.floor(total_hours / 24));
	
		const seconds = parseInt(total_seconds % 60);
		const minutes = parseInt(total_minutes % 60);
		const hours = parseInt(total_hours % 24);
	
		switch (format) {
			case 's':
				return total_seconds;
			case 'm':
				return total_minutes;
			case 'h':
				return total_hours;
			case 'd':
				return days;
			default:
				return { d: days, h: hours, m: minutes, s: seconds };
		}
	}

	msToTimeString(msObject, simple) {
		if (simple) {
			if (msObject['d'] > 0) {
				return 'more than a day';
			}
			return `${msObject['h'] > 0 ? `${msObject['h']}:` : ''}${msObject['h'] > 0 ? msObject['m'].toString().padStart(2, '0') : msObject['m']}:${msObject['s'].toString().padStart(2, '0')}`;
		}
		return `${msObject['d'] > 0 ? `${msObject['d']} day${msObject['d'] === 1 ? '' : 's'}, ` : ''}${msObject['h'] > 0 ? `${msObject['h']} hr${msObject['h'] === 1 ? '' : 's'}, ` : ''}${msObject['m'] > 0 ? `${msObject['m']} min${msObject['m'] === 1 ? '' : 's'}, ` : ''}${msObject['s'] > 0 ? `${msObject['s']} sec${msObject['s'] === 1 ? '' : 's'}, ` : ''}`.slice(0, -2);
	}

	render() {
		return this.state.msg ?? (
			<>
				<ToastContainer className="p-3 position-fixed" position="bottom-start">
					<Toast className="text-bg-success border-0" onClose={() => this.props.setFilterToast(false)} show={this.props.filterToast} delay={3000} autohide>
						<Toast.Body>Filters may take a few seconds to apply</Toast.Body>
					</Toast>
					<Toast className="text-bg-danger border-0" onClose={() => this.props.setMismatchToast(false)} show={this.props.mismatchToast} delay={3000} autohide>
						<Toast.Body>You need to be in my voice channel</Toast.Body>
					</Toast>
					<Toast className="text-bg-success border-0" onClose={() => this.props.setResumeToast(false)} show={this.props.resumeToast} delay={3000} autohide>
						<Toast.Body>Resuming your session</Toast.Body>
					</Toast>
				</ToastContainer>
				<MDBContainer>
					<MDBCard body background={this.props.theme === 'dark' ? 'gray' : 'light'} className="mb-2">
						<MDBBreadcrumb className="remove-bottom-margin m-3">
							<MDBBreadcrumbItem onClick={event => {this.props.navigate('/dashboard'); event.preventDefault();}}><a href="/dashboard">Dashboard</a></MDBBreadcrumbItem>
							<MDBBreadcrumbItem className={this.props.theme === 'dark' && 'text-light'} active><img className="guild-picture" src={this.props.guild.icon ? `https://cdn.discordapp.com/icons/${this.props.guild.id}/${this.props.guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/5.png'} alt="Guild" />{this.props.guild.name}</MDBBreadcrumbItem>
						</MDBBreadcrumb>
					</MDBCard>
					{this.props.timeout && <Alert variant="warning" className="mb-2"><strong>Quaver will leave soon.</strong> To continue your session, <code>/play</code> something!</Alert>}
					{this.props.pauseTimeout && <Alert variant="warning" className="mb-2"><strong>Quaver will leave soon.</strong> To resume your session, join Quaver's channel.</Alert>}
					{this.props.connected && this.props.playing.nothingPlaying && !this.props.timeout && <Alert variant="success" className="mb-2"><strong>24/7 mode enabled!</strong> Quaver will not automatically leave your channel.</Alert>}
					<MDBRow className="gx-2 gy-2">
						<MDBCol xs={12} lg={4}>
							<MDBRow className="gy-2">
								<MDBCol xs={12}>
									<MDBCard background={this.props.theme === 'dark' ? 'gray' : 'light'} className={this.props.theme === 'dark' ? 'text-white' : ''}>
										{!this.props.playing.nothingPlaying
											&& this.props.playing.track.sourceName === 'youtube'
											&& <Card.Img
												ref={this.imgRef}
												variant="top"
												src={`https://i3.ytimg.com/vi/${this.props.playing.track.identifier}/maxresdefault.jpg`}
												onLoad={() => {
													if (this.imgRef.current.naturalWidth === 120) this.imgRef.current.src = this.imgRef.current.src.replace('maxresdefault', 'hqdefault');
												}} />}
										<MDBCardBody>
											<MDBCardTitle
												className="truncate-text"
												style={{ lineHeight: 'normal' }}
												title={this.props.playing.nothingPlaying
													? this.props.connected
														? 'Nothing playing'
														: 'Not in a voice channel'
													: this.props.playing.track.title}>
												{this.props.playing.nothingPlaying
													? this.props.connected
														? 'Nothing playing'
														: 'Not in a voice channel'
													: this.props.playing.track.title}
											</MDBCardTitle>
											{!this.props.playing.nothingPlaying
												&& <MDBCardSubTitle
													className="mb-2 text-muted truncate-text"
													style={{ lineHeight: 'normal' }}
													text={this.props.playing.track.author}>
														{this.props.playing.track.author}
												</MDBCardSubTitle>}
											<div className="d-flex">
												<span className="justify-content-start">
													{this.props.playing.track?.isStream
														&& !this.props.playing.nothingPlaying
															? <MDBBadge color="danger">LIVE</MDBBadge>
															: this.msToTimeString(this.msToTime(this.props.playing.nothingPlaying ? 0 : this.props.playing.elapsed), true)}
												</span>
												<div className="flex-grow-1 mx-2">
												<Form.Range
													disabletooltip="true"
													ref={this.props.playRef}
													min={0}
													max={this.props.playing.nothingPlaying ? 0 : this.props.playing.duration / 1000}
													defaultValue={this.props.playing.nothingPlaying ? 0 : this.props.playing.elapsed / 1000}
													disabled={this.props.playing.track.requester !== this.props.user.id
														|| this.props.playing.duration === 0
														|| this.props.playing.nothingPlaying
														|| this.props.playing.track?.isStream
														|| this.props.pauseTimeout}
													onPointerDown={() => this.props.setUpdatePlay(false)}
													onPointerUp={event => this.props.seek(event.target.value * 1000)}
													onInput={event => {
														const currState = this.props.playing;
														currState.elapsed = event.target.value * 1000;
														this.props.setPlaying(currState);
													}}
													style={{ touchAction: "none" }}
												/>
												</div>
												{(!this.props.playing.track?.isStream || this.props.playing.nothingPlaying)
													&& <span className="justify-content-end">
														{this.msToTimeString(this.msToTime(this.props.playing.nothingPlaying ? 0 : this.props.playing.duration), true)}
													</span>}
											</div>
											{!this.props.playing.nothingPlaying
												&& <div className="status mt-2">
													<div>
														<MDBBadge color="secondary" className={this.props.theme === 'dark' ? 'text-dark' : ''}><i className="fa-solid fa-user-music fa-fw"></i> {this.props.playing.track.requesterTag}</MDBBadge>
													</div>
													{this.props.playing.skip
														&& <div className="status-value-right">
															<MDBBadge
																color={this.props.playing.skip.users.includes(this.props.user.id) ? 'success' : 'warning'}
																className={`text-${this.props.playing.skip.users.includes(this.props.user.id) ? 'light' : 'dark'}`}
															>
																	Skipping {this.props.playing.skip.users.length}/{this.props.playing.skip.required}
															</MDBBadge>
														</div>}
												</div>}
											{this.props.connected
												&& <div className="status">
													<div>
														<MDBBadge color="secondary" className={this.props.theme === 'dark' ? 'text-dark' : ''}><i className="fa-solid fa-volume fa-fw"></i> {this.props.channel}</MDBBadge>
													</div>
													{(this.props.timeout || this.props.pauseTimeout)
														&& <div className="status-value-right">
															<MDBBadge color="warning" className="text-dark">
																Leaving <ReactTimeAgo future date={this.props.timeout || this.props.pauseTimeout} />
															</MDBBadge>
														</div>}
												</div>}
											{this.props.connected
												&& <div className="status">
													<div>
														<MDBBadge color="secondary" className={this.props.theme === 'dark' ? 'text-dark' : ''}><i className="fa-solid fa-hashtag fa-fw"></i> {this.props.textChannel}</MDBBadge>
													</div>
												</div>}
										</MDBCardBody>
									</MDBCard>
								</MDBCol>
								<MDBCol xs={12}>
									<MDBCard background={this.props.theme === 'dark' ? 'gray' : 'light'} className={this.props.theme === 'dark' ? 'text-white' : ''}>
										<MDBCardBody>
											<div className="text-center mb-2">
												<MDBBtnGroup aria-label="Media controls">
													<MDBBtn
														size="lg"
														color={this.props.loop === 0
															?
																this.props.theme === 'dark'
																	? 'light'
																	: 'gray'
															: 'success'}
														className={`text-${this.props.loop !== 0 ? 'light' : this.props.theme}`}
														disabled={!this.props.connected || this.props.pauseTimeout}
														onMouseDown={event => event.preventDefault()}
														onClick={() => this.props.setLoop(this.props.loop + 1 > 2 ? 0 : this.props.loop + 1)}>
														<i className={this.props.loop !== 2 ? "fa-solid fa-repeat fa-fw" : "fa-solid fa-repeat-1 fa-fw"}></i>
													</MDBBtn>
													<MDBBtn
														size="lg"
														color={this.props.theme === 'dark' ? 'light' : 'gray'}
														className={`text-${this.props.theme}`}
														disabled={!this.props.connected
															|| this.props.pauseTimeout
															|| this.props.queue.length < 2}
														onMouseDown={event => event.preventDefault()}
														onClick={() => this.props.shuffle()}>
														<i className="fa-solid fa-shuffle fa-fw"></i>
													</MDBBtn>
													<MDBBtn
														size="lg"
														color={this.props.theme === 'dark' ? 'light' : 'gray'}
														className={`text-${this.props.theme}`}
														disabled={!this.props.connected
															|| this.props.pauseTimeout
															|| this.props.playing.nothingPlaying}
														onMouseDown={event => event.preventDefault()}
														onClick={() => this.props.setPaused(!this.props.paused)}>
														<i className={this.props.paused ? "fa-solid fa-play fa-fw" : "fa-solid fa-pause fa-fw"}></i>
													</MDBBtn>
													<MDBBtn
														size="lg"
														color={this.props.theme === 'dark' ? 'light' : 'gray'}
														className={`text-${this.props.theme}`}
														disabled={!this.props.connected
															|| this.props.pauseTimeout
															|| this.props.playing.nothingPlaying
															|| this.props.playing.skip?.users?.includes(this.props.user.id)}
														onMouseDown={event => event.preventDefault()}
														onClick={() => this.props.skip()}>
														<i className="fa-solid fa-forward fa-fw"></i>
													</MDBBtn>
												</MDBBtnGroup>
											</div>
											<div className="text-center mb-2 button-wrap">
												<MDBBtn
													size="sm"
													color={this.props.filters.bassboost
														? 'success'
														: this.props.theme === 'dark'
															? 'light'
															: 'gray'}
													disabled={!this.props.connected || this.props.pauseTimeout}
													className={`me-1 text-${this.props.theme}`}
													onMouseDown={event => event.preventDefault()}
													onClick={() => this.props.setBassboost(!this.props.filters.bassboost)}>
													<i className="fa-solid fa-headphones-alt fa-fw"></i> Bassboost
												</MDBBtn>
												<MDBBtn
													size="sm"
													color={this.props.filters.nightcore
														? 'success'
														: this.props.theme === 'dark'
															? 'light' : 'gray'}
													disabled={!this.props.connected || this.props.pauseTimeout}
													className={`me-1 text-${this.props.theme}`}
													onMouseDown={event => event.preventDefault()}
													onClick={() => this.props.setNightcore(!this.props.filters.nightcore)}>
														<i className="fa-solid fa-moon fa-fw"></i> Nightcore
												</MDBBtn>
												<MDBBtn
													size="sm"
													color="primary"
													disabled={
														!this.props.connected
															|| this.props.playing.nothingPlaying
													}
													href={this.props.playing.track?.uri ?? "#"}
													target="_blank"
													onMouseDown={event => event.preventDefault()}>
													<i className="fa-solid fa-arrow-up-right-from-square fa-fw"></i>
												</MDBBtn>
											</div>
											<div className="text-center volume mx-auto">
												<div className="volume-elements me-2">
													<i className={'fa-fw fa-solid fa-' + (
														this.props.volume === 0
															? 'volume-xmark'
															: this.props.volume <= 50
																? 'volume-low'
																: this.props.volume <= 100
																	? 'volume'
																	: 'volume-high')}></i>
												</div>
												<div className="volume-elements">
													<Form.Range
														ref={this.props.volumeRef}
														min={0}
														max={200}
														defaultValue={this.props.volume}
														disabled={!this.props.connected || this.props.pauseTimeout}
														onPointerDown={() => this.props.setUpdateVolume(false)}
														onPointerUp={event => {
															this.props.setVolume(event.target.value);
															this.props.setUpdateVolume(true);
														}}
														onInput={event => this.props.setVolumeDisplay(event.target.value)}
														list="volumes"
														style={{ touchAction: 'none' }} />
													<datalist id="volumes">
														<option value="0" />
														<option value="50" />
														<option value="100" />
														<option value="150" />
														<option value="200" />
													</datalist>
												</div>
												<div className="volume-elements ms-2" style={{ maxWidth: '30px' }}>
													<p className="my-0">{this.props.volume}%</p>
												</div>
											</div>
										</MDBCardBody>
									</MDBCard>
								</MDBCol>
							</MDBRow>
						</MDBCol>
						<MDBCol xs={12} lg={8}>
							<MDBCard background={this.props.theme === 'dark' ? 'gray' : 'light'} className={this.props.theme === 'dark' ? 'text-white' : ''}>
								<MDBCardHeader>Queue</MDBCardHeader>
								<MDBCardBody className={this.props.queue?.length !== 0 && 'p-0'}>
									{this.props.queue?.length === 0
										? <MDBCardText>Nothing coming up</MDBCardText>
										: <MDBListGroup numbered className="list-group-flush">
											{this.props.queue.map((track, index) => (
												<MDBListGroupItem
													color={this.props.theme === 'dark' ? 'gray' : ''}
													className={`d-flex justify-content-start align-items-start${this.props.theme === 'dark' ? ' text-white' : ''}`}
													key={track.identifier}>
													<div className="ms-2" style={{ minWidth: '0' }}>
														<div className="fw-bold d-flex">
															<span className="truncate-text me-1" style={{ lineHeight: 'normal' }}>
																{track.title}
															</span>
															{track.isStream
																? <MDBBadge color="danger">LIVE</MDBBadge>
																: <MDBBadge color={this.props.theme === 'dark' ? 'light' : 'gray'} className={this.props.theme === 'dark' ? 'text-dark' : ''}>{this.msToTimeString(this.msToTime(track.length), true)}</MDBBadge>}
														</div>
														<small style={{ display: 'block' }}>{track.author}</small>
														<MDBBadge color="secondary" className={this.props.theme === 'dark' ? 'text-dark' : ''}><i className="fa-solid fa-user-music fa-fw"></i> {track.requesterTag}</MDBBadge>
													</div>
													<div className="ps-4 ms-auto my-auto">
														<MDBBtnGroup aria-label="Action buttons">
															{track.requester === this.props.user.id
																&& <MDBBtn
																	color="danger"
																	onMouseDown={event => event.preventDefault()}
																	onClick={() => this.props.remove(index)}>
																	<i className="fa-solid fa-close fa-fw"></i>
																</MDBBtn>}
															<MDBBtn
																href={track.uri}
																target="_blank"
																onMouseDown={event => event.preventDefault()}>
																<i className="fa-solid fa-arrow-up-right-from-square fa-fw"></i>
															</MDBBtn>
														</MDBBtnGroup>
													</div>
												</MDBListGroupItem>
											))}
										</MDBListGroup>}
								</MDBCardBody>
								{this.props.queue?.length !== 0
									&& <MDBCardFooter>
										<small className={this.props.theme === 'dark' ? 'text-light' : 'text-muted'}>
											Queue duration: {this.msToTimeString(this.msToTime(this.props.queue.map(track => track.length).reduce((acc, a) => acc + a, 0)), true)}
										</small>
									</MDBCardFooter>}
							</MDBCard>
						</MDBCol>
					</MDBRow>
				</MDBContainer>
				<footer className="py-3 my-4">
					<p className="text-center text-muted">Quaver Version: {this.props.version}</p>
				</footer>
			</>
		);
	}
}

export default withRouter(Guild);
