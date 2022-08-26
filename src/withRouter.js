import { useNavigate, useParams } from "react-router-dom";
import { useCookies } from "react-cookie";

const withRouter = Component => props => {
	const navigate = useNavigate();
	const [cookies, setCookie, removeCookie] = useCookies();
	const params = useParams();

	return <Component params={params} navigate={navigate} cookies={cookies} setCookie={setCookie} removeCookie={removeCookie} {...props} />;
};

export default withRouter;
