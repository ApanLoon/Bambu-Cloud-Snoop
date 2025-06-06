import dotenv from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

import { BambuCloud } from "./BambuCloud/BambuCloud";

console.log("Bambu-Cloud-Snoop");

dotenv.config();

const userName = process.env.USER_NAME;
const password = process.env.PASSWORD;
const accessToken = process.env.ACCESS_TOKEN || null;

const cloud = new BambuCloud(accessToken);

const testTasks = async ()=>
{
    let tasks = await cloud.getTasks();
    console.log(tasks.total, tasks.hits.length);
    // tasks.hits.forEach(async task =>
    // {
    //    console.log(`Downloading cover image for ${task.name} (${task.id})...`);
    //    await cloud.downloadFile(task.cover, `archive/${task.id}-cover.png`);
    // });
}

const downloadProjects = async ()=>
{
    let projectList = await cloud.getProjects();
    writeFileSync(`projectArchive/projectlist.json`, JSON.stringify(projectList, null, 2));

    projectList.projects.forEach(async project =>
    {
        console.log (`Getting project: ${project.name} (${project.project_id})...`);

        const startTime = (project.create_time as string).replace(/[-:]/g, "").replace(" ", "-");
        const projectFolder = `projectArchive/${startTime}-${project.name}`;

        if (!existsSync(projectFolder)) mkdirSync(projectFolder);
        const metadataFolder = `${projectFolder}/Metadata`;
        if (!existsSync(metadataFolder)) mkdirSync(metadataFolder);

        let details = await cloud.getProjectDetails(project.project_id);
        writeFileSync(`${projectFolder}/project.json`, JSON.stringify(details, null, 2));

        details.profiles.forEach(async profile =>
        {
            profile.context.configs.forEach (async config =>
            {
                console.log (`Downloading ${config.name} to ${metadataFolder}...`);
                await cloud.downloadFile(config.url, `${metadataFolder}/${config.name}`);
            });

            profile.context.plates.forEach (async plate =>
            {
                console.log (`Downloading ${plate.name}(${plate.index}) to ${metadataFolder}...`);
                await cloud.downloadFile(plate.thumbnail.url, `${metadataFolder}/${plate.thumbnail.name}`);
                await cloud.downloadFile(plate.top_picture.url, `${metadataFolder}/${plate.top_picture.name}`);
                await cloud.downloadFile(plate.pick_picture.url, `${metadataFolder}/${plate.pick_picture.name}`);
                await cloud.downloadFile(plate.no_light_picture.url, `${metadataFolder}/${plate.no_light_picture.name}`);
            });

        });
    });
};

(async () =>
{
    await cloud.login(userName, password);

    //await testTasks();
    await downloadProjects();
})();
