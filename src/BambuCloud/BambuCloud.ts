import axios, { AxiosResponse, AxiosRequestConfig, RawAxiosRequestHeaders, AxiosInstance } from 'axios';
import { Input } from "../Input/Input";
import { writeFileSync } from 'fs';

const BaseUrl = "https://api.bambulab.com/v1/";
const RequestConfig: AxiosRequestConfig =
{
    headers:
    {
        "Content-Type" : "application/json",
        "Accept"       : "application/json"
    } as RawAxiosRequestHeaders
};

export class BambuCloud
{
    private _client: AxiosInstance;
    
    constructor(accessToken : string | null)
    {
        this._client = axios.create(
        {
            baseURL: BaseUrl,
        });

        if (accessToken !== null)
        {
            this._client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
    }

    public async login (userName : string, password : string)
    {
        if (this._client.defaults.headers.common['Authorization'] !== undefined)
        {
            return;
        }

        let ok = false;
        while (!ok)
        {
            try
            {
                console.log ("Requesting verification code...");
                let response : AxiosResponse = await this._client.post(
                    "user-service/user/login",
                    JSON.stringify (
                    {
                        account: userName,
                        password: password
                    }),
                    RequestConfig);

                const code = await Input("Verification code: ");

                response = await this._client.post(
                    "user-service/user/login",
                    JSON.stringify (
                    {
                        account: userName,
                        code: code
                    }),
                    RequestConfig);

                ok = true;

                this._client.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            }
            catch (error)
            {
                console.error (error.response.data.error);
            }
        }
    }

    public async getTasks(after? : string, limit? : number)
    {
        try
        {
            let query = "";
            if (after !== undefined)
            {
                query += query.length === 0 ? "?" : "&";
                query += `after=${encodeURI(after)}`; // TODO: It is unclear what after is supposed to do if anything.
            }
            if (limit !== undefined)
            {
                query += query.length === 0 ? "?" : "&";
                query += `limit=${limit}`;
            }

            let response : AxiosResponse = await this._client.get(
                `/user-service/my/tasks${query}`,
                RequestConfig);
            return(response.data);
        }
        catch (error)
        {
            console.error (error);
        }
    }

    public async getProjects()
    {
        try
        {
            let response : AxiosResponse = await this._client.get(
                "iot-service/api/user/project",
                RequestConfig);
            return(response.data);
        }
        catch (error)
        {
            console.error (error);
        }
    }

    public async getProjectDetails(projectId : string)
    {
        try
        {
            let response : AxiosResponse = await this._client.get(
                `iot-service/api/user/project/${projectId}`,
                RequestConfig);
            return(response.data);
        }
        catch (error)
        {
            console.error (error);
        }
    }

    public async getFile(url : string)
    {
        try
        {
            const client = axios.create();
            let response : AxiosResponse = await client.get(url);
            return response.data;
        }
        catch (error)
        {
            console.error (error);
        }
    }

    public async downloadFile(url : string, localPath : string)
    {
        try
        {
            const client = axios.create();
            let response : AxiosResponse = await client.get(url, {responseType: "arraybuffer"});

            let data = response.data;
            if (response.headers["content-type"] === "application/json")
            {
                data = JSON.stringify(response.data, null, 2);
            }
            writeFileSync (localPath, data, { flag: "w" });
        }
        catch (error)
        {
            console.error (error);
        }
    }
}