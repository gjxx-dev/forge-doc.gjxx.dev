import { defineConfig } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Forge Doc",
    description: "Forge Doc",
    vite: {
        server: {
            port: 5174,
        },
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: generateSidebar({
            useTitleFromFileHeading: true,
            collapsed: true,
            documentRootPath: "/docs",
            sortFolderTo: "bottom",
            useFolderTitleFromIndexFile: true,
            includeFolderIndexFile: false,
        }),

        socialLinks: [
            { icon: "github", link: "https://github.com/vuejs/vitepress" },
        ],
    },
});
