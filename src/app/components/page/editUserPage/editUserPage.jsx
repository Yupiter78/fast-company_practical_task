import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { validator } from "../../../utils/ validator";
import TextField from "../../common/form/textField";
import SelectField from "../../common/form/selectField";
import RadioField from "../../common/form/radio.Field";
import MultiSelectField from "../../common/form/multiSelectField";
import BackHistoryButton from "../../common/backButton";
import { useProfessions } from "../../../hooks/useProfession";
import { useQualities } from "../../../hooks/useQualities";
import { useAuth } from "../../../hooks/useAuth";

const EditUserPage = () => {
    const { userId } = useParams();
    const history = useHistory();
    const { currentUser, update } = useAuth();
    const [data, setData] = useState();
    const {
        qualities,
        getQuality,
        isLoading: qualityIsLoading
    } = useQualities();
    const qualitiesList = qualities.map((q) => ({
        label: q.name,
        value: q._id
    }));
    const { professions, isLoading: professionIsLoading } = useProfessions();
    const professionsList = professions.map((p) => ({
        label: p.name,
        value: p._id
    }));
    const [errors, setErrors] = useState({});

    const validatorConfig = {
        name: {
            isRequired: { message: "Имя обязательно для заполнения" }
        },
        email: {
            isRequired: {
                message: "Электронная почта обязательна для заполнения"
            },
            isEmail: { message: "Введите корректный email" }
        },
        password: {
            isRequired: { message: "Пароль обязателен для заполнения" },
            hasCapital: {
                message: "Пароль должен содержать хотя бы одну заглавную букву"
            },
            hasNumber: {
                message: "Пароль должен содержать хотя бы одну цифру"
            },
            min: {
                message: "Пароль должен состоять из 8 и более символов",
                value: 8
            }
        },
        profession: {
            isRequired: { message: "Профессию выбрать обязательно" }
        },
        license: {
            isRequired: {
                message:
                    "Вы не можете использовать наш сервис без подтверждения лицензионного соглашения"
            }
        }
    };

    if (userId !== currentUser._id) {
        history.push(`/users/${currentUser._id}/edit`);
    }

    useEffect(() => {
        if (!professionIsLoading && !qualityIsLoading) {
            loadingData(currentUser);
        }
    }, [professionIsLoading, qualityIsLoading]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const isValid = validate();
        if (!isValid) return;
        const qualities = data.qualities.map((q) => q.value);
        const newData = {
            ...data,
            qualities
        };
        delete newData.email;
        delete newData.password;
        try {
            await update(data.email, data.password, newData);
            history.push(`/users/${userId}`);
        } catch (err) {
            setErrors(err);
        }
    };

    function getQualitiesById(qualitiesId) {
        const qualities = qualitiesId.map((q) => getQuality(q));
        return qualities.map((q) => ({ label: q.name, value: q._id }));
    }

    const loadingData = (user) => {
        const newData = {
            ...user,
            password: "",
            qualities: getQualitiesById(user.qualities)
        };
        setData(newData);
    };
    useEffect(() => {
        validate();
    }, [data]);

    const handleChange = (target) => {
        setData((prevState) => ({
            ...prevState,
            [target.name]: target.value
        }));
    };
    const validate = () => {
        const errors = validator(data, validatorConfig);
        setErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const isValid = Object.keys(errors).length === 0;

    return (
        <div className="container mt-5">
            <BackHistoryButton />
            <div className="row">
                <div className="col-md-6 offset-md-3 shadow p-4">
                    <div className="mb-4">
                        <img
                            src={currentUser.image}
                            className="rounded-circle shadow-1-strong me-3"
                            alt="avatar"
                            width="65"
                            height="65"
                        />
                    </div>
                    {data ? (
                        <form onSubmit={handleSubmit}>
                            <TextField
                                label="Имя"
                                name="name"
                                value={data.name}
                                onChange={handleChange}
                                error={errors.name}
                            />
                            <TextField
                                label="Электронная почта"
                                name="email"
                                value={data.email}
                                onChange={handleChange}
                                error={errors.email}
                            />
                            <TextField
                                name="password"
                                label="Пароль"
                                type="password"
                                value={data.password ? data.password : ""}
                                onChange={handleChange}
                                error={errors.password}
                            />
                            <SelectField
                                label="Выбери свою профессию"
                                defaultOption="Choose..."
                                name="profession"
                                options={professionsList}
                                onChange={handleChange}
                                value={data.profession}
                                error={errors.profession}
                            />
                            <RadioField
                                options={[
                                    { name: "Male", value: "male" },
                                    { name: "Female", value: "female" },
                                    { name: "Other", value: "other" }
                                ]}
                                value={data.sex}
                                name="sex"
                                onChange={handleChange}
                                label="Выберите ваш пол"
                            />
                            <MultiSelectField
                                defaultValue={data.qualities}
                                options={qualitiesList}
                                onChange={handleChange}
                                values
                                name="qualities"
                                label="Выберите ваши качесвта"
                            />
                            <button
                                type="submit"
                                disabled={!isValid}
                                className="btn btn-primary w-100 mx-auto"
                            >
                                Обновить
                            </button>
                        </form>
                    ) : (
                        "Loading..."
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditUserPage;
