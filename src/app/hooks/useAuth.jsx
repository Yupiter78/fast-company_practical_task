import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import axios from "axios";
import userService from "../services/user.service";
import localStorageService, {
    removeAuthData,
    setTokens
} from "../services/localStorage.service";
import { useHistory } from "react-router-dom";

export const httpAuth = axios.create({
    baseURL: "https://identitytoolkit.googleapis.com/v1/",
    params: {
        key: process.env.REACT_APP_FIREBASE_KEY
    }
});
const AuthContext = React.createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
    const [currentUser, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const history = useHistory();

    async function logIn({ email, password }) {
        try {
            const { data } = await httpAuth.post(
                `accounts:signInWithPassword`,
                {
                    email,
                    password,
                    returnSecureToken: true
                }
            );
            setTokens(data);
            await getUserData();
        } catch (error) {
            errorCatcher(error);
            const { code, message } = error.response.data.error;
            console.log(code, message);
            if (code === 400) {
                switch (message) {
                    case "INVALID_PASSWORD":
                        throw new Error("Wrong password");
                    case "EMAIL_NOT_FOUND":
                        throw new Error("User with this Email was not found");
                    default:
                        throw new Error(
                            "Слишком много попыток входа. Попробуйте позднее"
                        );
                }
            }
        }
    }

    function logOut() {
        removeAuthData();
        setUser(null);
        history.push("/");
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    async function signUp({ email, password, ...rest }) {
        try {
            const { data } = await httpAuth.post(`accounts:signUp`, {
                email,
                password,
                returnSecureToken: true
            });
            setTokens(data);

            await createUser({
                _id: data.localId,
                email,
                completedMeetings: randomInt(0, 200),
                rate: randomInt(1, 5),
                image: `https://avatars.dicebear.com/api/avataaars/${(
                    Math.random() + 1
                )
                    .toString(36)
                    .substring(7)}.svg`,
                ...rest
            });
        } catch (error) {
            errorCatcher(error);
            const { code, message } = error.response.data.error;
            if (code === 400) {
                if (message === "EMAIL_EXISTS") {
                    // eslint-disable-next-line no-throw-literal
                    throw {
                        email: "Пользователь с таким Email уже существует"
                    };
                }
            }
        }
    }

    async function createUser(data) {
        try {
            const { content } = await userService.create(data);
            setUser(content);
        } catch (error) {
            errorCatcher(error);
        }
    }

    function errorCatcher(error) {
        const { message } = error.response.data;
        setError(message);
    }

    async function getUserData() {
        try {
            const { content } = await userService.getCurrentUser();
            setUser(content);
        } catch (error) {
            errorCatcher(error);
        } finally {
            setLoading(false);
        }
    }

    async function update(email, password, userData) {
        try {
            const { data } = await httpAuth.post(`accounts:update`, {
                idToken: localStorageService.getAccessToken(),
                email,
                password,
                returnSecureToken: true
            });
            setTokens(data);

            await updateUser(data.localId, {
                email,
                ...userData
            });

            await getUserData();
        } catch (err) {
            const { code, message } = err.response.data.error;
            if (code === 400) {
                if (message === "EMAIL_EXISTS") {
                    // eslint-disable-next-line no-throw-literal
                    throw {
                        email: "Пользователь с таким EMAIL уже существует"
                    };
                }
                // else if (message === 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN') {
                //   throw new Error('Учетные данные устарели. Войдите в систему снова!')
                // }
            }
            errorCatcher(err);
        }
    }

    async function updateUser(id, data) {
        try {
            const { content } = await userService.update(id, data);
            setUser(content);
        } catch (err) {
            errorCatcher(err);
        }
    }

    useEffect(() => {
        if (localStorageService.getAccessToken()) {
            getUserData();
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (error !== null) {
            toast(error);
            setError(null);
        }
    }, [error]);
    return (
        <AuthContext.Provider
            value={{ signUp, logIn, currentUser, logOut, update }}
        >
            {!isLoading ? children : "loading..."}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ])
};

export default AuthProvider;
