/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ReactNode } from "react";

const settings = definePluginSettings({
    intensity: {
        description: "Animation intensity in px",
        type: OptionType.SLIDER,
        default: 4,
        markers: makeRange(1, 10, 1),
        stickToMarkers: true,
        onChange: () => updateStyles()
    },
});

let styles: HTMLStyleElement;
const updateStyles = () => {
    const inten = Vencord.Settings.plugins.WigglyText.intensity + "px";
    styles.textContent = `
        .wiggly-inner {
            animation: 1.2s wiggle-wavy-x ease-in-out infinite,
                1.2s wiggle-wavy-y ease-in-out infinite;
            position: relative;
            top: 0;
            left: 0;
        }

        @keyframes wiggle-wavy-x {
            0% {
                left: -${inten};
            }

            50% {
                left: ${inten};
            }

            100% {
                left: -${inten};
            }
        }

        @keyframes wiggle-wavy-y {
            0% {
                animation-timing-function: ease-out;
            }

            25% {
                top: ${inten};
                animation-timing-function: ease-in;
            }

            50% {
                animation-timing-function: ease-out;
            }

            75% {
                top: -${inten};
                animation-timing-function: ease-in;
            }

            100% {
                animation-timing-function: ease-out;
            }
        }`;
};

export default definePlugin({
    name: "WigglyText",
    description: "Adds a new markdown formatting that makes text ~wiggly~",
    authors: [EquicordDevs.nexpid],
    settings,

    patches: [
        {
            find: "parseToAST:",
            replacement: {
                match: /(parse[\w]*):(.*?)\((\i)\),/g,
                replace: "$1:$2({...$3,wiggly:$self.wigglyRule}),",
            },
        },
    ],

    wigglyRule: {
        order: 24,
        match: (source: string) => source.match(/^~([\s\S]+?)~(?!_)/),
        parse: (
            capture: RegExpMatchArray,
            transform: (...args: any[]) => any,
            state: any
        ) => ({
            content: transform(capture[1], state),
        }),
        react: (
            data: { content: any[]; },
            output: (...args: any[]) => ReactNode[]
        ) => {
            let offset = 0;
            const traverse = (raw: any) => {
                const children = !Array.isArray(raw) ? [raw] : raw;
                let modified = false;

                let j = -1;
                for (const child of children) {
                    j++;
                    if (typeof child === "string") {
                        modified = true;
                        children[j] = child.split("").map((x, i) => (
                            <span key={i}>
                                <span
                                    className="wiggly-inner"
                                    style={{
                                        animationDelay: `${((offset++) * 25) % 1200}ms`,
                                        ["--intensity" as any]: "4px",
                                        ["--intensity-neg" as any]: "-4px",
                                    }}
                                >
                                    {x}
                                </span>
                            </span>
                        ));
                    } else if (child?.props?.children)
                        child.props.children = traverse(child.props.children);
                }

                return modified ? children : raw;
            };

            return traverse(output(data.content));
        },
    },

    start: () => {
        styles = document.createElement("style");
        styles.id = "WigglyText";
        document.head.appendChild(styles);

        updateStyles();
    },

    stop: () => styles.remove()
});
