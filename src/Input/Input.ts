import { createInterface } from "readline/promises";

export async function Input (prompt : string)
{
    const rl = createInterface(
    {
        input: process.stdin,
        output: process.stdout
    });
    const answer = await rl.question (prompt);
    rl.close();
    return answer;
}
