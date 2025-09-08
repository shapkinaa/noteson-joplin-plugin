// const FormData = require('form-data');

import axios from "axios";

export async function http_get(url: string, token: any = null, params: any = null): Promise<any> {
    try {
        const headers = {
            "Accept": "application/json",
            "Authorization": 'Bearer ' + token,
        }

        const response = await axios.get(url,
                                {
                                    "headers": headers,
                                    "params": params
                                }
                            ).then(result => {
                                    return result.data;
                                }, error => {
                                    console.error(error);
                                }
                            );
        return response;
    } 
    catch (error) {
        console.error(error);
        throw 'Connection to server NotesOn.ru failed';
    }
}

export async function http_post(url: string, data: any = null, token: any = null): Promise<any> {
    try {
        const headers = {
            "Accept": "application/json",
            "Content-Type": (data) ? "application/json": "",
            "Authorization": (token) ? 'Bearer ' + token: "",
        }

        const body = (data ? JSON.stringify(data) : {});

        const response = await axios.post(url, 
                                body,
                                {
                                    "headers": headers
                                }
                            ).then(result => {
                                    return result.data;
                                }, error => {
                                    console.error(error);
                                }
                            );
        return response;
    }
    catch (error) {
        console.error(error);
        throw 'Connection to server NotesOn.ru failed';
    }
}

export async function http_post_formdata(url: string, formdata: FormData, token: string): Promise<any> {
    try {
        const response = await axios.post(url, 
                                        formdata,
                                        {
                                            "headers": {
                                                'Authorization': 'Bearer ' + token
                                            }
                                        }
                                    ).then(result => {
                                            console.log(result);
                                            return result;
                                        }, error => {
                                            if (error.response.status == 303) {
                                                return {
                                                    'status': 303
                                                }
                                            }

                                            // console.log(error)
                                            return error;
                                        }
                                    );
        return response;
    } 
    catch (error) {
        console.error(error);
        throw 'Connection to server NotesOn.ru failed';
    }
}

export async function http_delete(url: string,	token: string): Promise<any> {
    try {
        const response = await axios.delete(url,
                                        {
                                            headers: {
                                                "Accept": "application/json",
                                                "Content-Type": "",
                                                "Authorization": 'Bearer ' + token,
                                            }
                                        }
                                    ).then(result => {
                                            return result.data;
                                        }, error => {
                                            console.error(error);
                                        }
                                    );
        return response;
    } 
    catch (error) {
        console.error(error);
        throw 'Connection to server NotesOn.ru failed';
    }
}
