import { Command, CommandUtil, ParsedComponentData } from "discord-akairo";
import { Message, MessageEmbed, Util } from "discord.js";

export default class EvalCommand extends Command {
    constructor() {
        super("eval", {
            aliases: ["eval"],
            ownerOnly: true,
        });
    }

    exec(message: Message): void {
        if (message.util === undefined) return;
        message.channel
            .send(
                new MessageEmbed()
                    .setTitle("Processing...")
                    .setColor(Util.resolveColor("BLUE"))
            )
            .then((reply) => {
                try {
                    // eslint-disable-next-line no-eval
                    const output = eval(
                        ((message.util as CommandUtil).parsed as ParsedComponentData).content as string
                    );
                    reply.edit(
                        new MessageEmbed()
                            .setTitle(`Evaluated code...`)
                            .addField(
                                "Returns",
                                `\`\`\`javascript\n${output}\`\`\``
                            )
                            .setColor(Util.resolveColor("GREEN"))
                    );
                } catch (err) {
                    console.log(err);
                    reply.edit(
                        new MessageEmbed()
                            .setTitle(`Error in code...`)
                            .addField(
                                "Error Message",
                                `\`\`\`javascript\n${err}\`\`\``
                            )
                            .setColor(Util.resolveColor("RED"))
                    );
                }
            });
    }
}
