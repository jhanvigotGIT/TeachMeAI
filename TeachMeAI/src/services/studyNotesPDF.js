import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { marked } from "marked";

pdfMake.vfs = pdfFonts.vfs;

marked.setOptions({
    gfm: true,
    breaks: true
});

// Convert Markdown inline formatting into PDF formatting
const convertInline = (tokens = []) => {
    return tokens.map(token => {

        switch (token.type) {

            case "strong":
                return {
                    text: convertInline(token.tokens),
                    bold: true
                };

            case "em":
                return {
                    text: convertInline(token.tokens),
                    italics: true
                };

            case "codespan":
                return {
                    text: token.text,
                    fontSize: 9,
                    color: "#2563eb",
                    background: "#eff6ff"
                };

            case "link":
                return {
                    text: convertInline(token.tokens),
                    color: "#2563eb",
                    decoration: "underline",
                    link: token.href
                };

            case "del":
                return {
                    text: convertInline(token.tokens),
                    decoration: "lineThrough"
                };

            case "br":
                return { text: "\n" };

            case "image":
                return {
                    text: token.text || "[Image]",
                    italics: true,
                    color: "#64748b"
                };

            case "text":
                return token.tokens
                    ? convertInline(token.tokens)
                    : token.text;

            case "escape":
                return token.text;

            default:
                return token.text || "";
        }

    });
};


// Convert Markdown blocks into PDF elements
const convertBlocks = (tokens = []) => {

    const content = [];

    tokens.forEach(token => {

        switch (token.type) {

            case "heading":

                content.push({
                    text: convertInline(token.tokens),
                    style: token.depth === 1
                        ? "heading1"
                        : token.depth === 2
                            ? "heading2"
                            : "heading3",
                    margin: [0, 18, 0, 9],
                    headlineLevel: token.depth
                });

                break;


            case "paragraph":

                content.push({
                    text: convertInline(token.tokens),
                    style: "paragraph"
                });

                break;


            case "text":

                content.push({
                    text: convertInline(token.tokens),
                    style: "paragraph"
                });

                break;


            case "list":

                const listItems = token.items.map(item => ({
                    stack: convertBlocks(item.tokens || [])
                }));

                content.push({
                    [token.ordered ? "ol" : "ul"]: listItems,
                    margin: [0, 5, 0, 12],
                    ...(token.ordered ? { start: token.start || 1 } : {})
                });

                break;


            case "table":

                const tableBody = [];

                tableBody.push(
                    token.header.map(cell => ({
                        text: convertInline(cell.tokens),
                        bold: true,
                        color: "#ffffff",
                        fillColor: "#1e3a5f",
                        margin: [7, 8, 7, 8]
                    }))
                );

                token.rows.forEach(row => {

                    tableBody.push(
                        row.map((cell, index) => ({
                            text: convertInline(cell.tokens),
                            fillColor: tableBody.length % 2 === 0
                                ? "#f1f5f9"
                                : "#ffffff",
                            margin: [7, 7, 7, 7],
                            alignment: token.align?.[index] || "left"
                        }))
                    );

                });

                content.push({
                    table: {
                        headerRows: 1,
                        widths: Array(token.header.length).fill("*"),
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: () => 0.7,
                        vLineWidth: () => 0.7,
                        hLineColor: () => "#cbd5e1",
                        vLineColor: () => "#cbd5e1"
                    },
                    margin: [0, 10, 0, 18]
                });

                break;


            case "code":

                content.push({
                    text: token.text,
                    style: "codeBlock",
                    margin: [0, 8, 0, 15],
                    fillColor: "#f1f5f9",
                    border: [false, false, false, false]
                });

                break;


            case "blockquote":

                content.push({
                    stack: convertBlocks(token.tokens),
                    margin: [12, 8, 0, 12],
                    color: "#475569",
                    italics: true
                });

                break;


            case "hr":

                content.push({
                    canvas: [{
                        type: "line",
                        x1: 0,
                        y1: 5,
                        x2: 515,
                        y2: 5,
                        lineWidth: 1,
                        lineColor: "#cbd5e1"
                    }],
                    margin: [0, 12, 0, 12]
                });

                break;


            case "space":
                break;


            default:
                break;

        }

    });

    return content;
};


// Main PDF generation function
export const generateStudyNotesPDF = (messages, aiResponse) => {

    const assistantMessages = messages?.length
        ? messages.filter(message => message.role === "assistant")
        : aiResponse
            ? [{ role: "assistant", text: aiResponse }]
            : [];

    if (!assistantMessages.length) {
        throw new Error("No AI explanation available to download.");
    }

    const documentContent = [];

    assistantMessages.forEach((message, index) => {

        if (index > 0) {
            documentContent.push({
                text: "Additional Explanation",
                style: "heading1",
                pageBreak: "before"
            });
        }

        const tokens = marked.lexer(message.text || "");

        documentContent.push(...convertBlocks(tokens));

    });


    const documentDefinition = {

        pageSize: "A4",

        pageMargins: [50, 65, 50, 60],

        info: {
            title: "TeachMeAI Study Notes",
            author: "TeachMeAI",
            subject: "AI-generated learning notes"
        },

        header: (currentPage) => {

            if (currentPage === 1) return null;

            return {
                text: "TEACHMEAI  |  STUDY NOTES",
                alignment: "right",
                margin: [0, 25, 50, 0],
                fontSize: 8,
                color: "#64748b",
                bold: true
            };

        },

        footer: (currentPage, pageCount) => ({

            columns: [
                {
                    text: "Generated with TeachMeAI",
                    alignment: "left"
                },
                {
                    text: `${currentPage} / ${pageCount}`,
                    alignment: "right"
                }
            ],

            margin: [50, 15, 50, 0],
            fontSize: 8,
            color: "#64748b"

        }),

        content: [

            {
                text: "TEACHMEAI",
                fontSize: 13,
                bold: true,
                color: "#2563eb",
                characterSpacing: 2,
                margin: [0, 0, 0, 8]
            },

            {
                text: "STUDY NOTES",
                fontSize: 27,
                bold: true,
                color: "#1e3a5f",
                margin: [0, 0, 0, 5]
            },

            {
                text: "Your AI-generated learning guide",
                fontSize: 11,
                color: "#64748b",
                margin: [0, 0, 0, 5]
            },

            {
                text: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                fontSize: 9,
                color: "#94a3b8",
                margin: [0, 0, 0, 25]
            },

            {
                canvas: [{
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 495,
                    y2: 0,
                    lineWidth: 2,
                    lineColor: "#2563eb"
                }],
                margin: [0, 0, 0, 25]
            },

            ...documentContent

        ],

        styles: {

            heading1: {
                fontSize: 19,
                bold: true,
                color: "#1e3a5f",
                margin: [0, 18, 0, 10]
            },

            heading2: {
                fontSize: 15,
                bold: true,
                color: "#2563eb",
                margin: [0, 15, 0, 8]
            },

            heading3: {
                fontSize: 12,
                bold: true,
                color: "#334155",
                margin: [0, 12, 0, 6]
            },

            paragraph: {
                fontSize: 10.5,
                color: "#334155",
                lineHeight: 1.45,
                margin: [0, 3, 0, 10]
            },

            codeBlock: {
                fontSize: 9,
                color: "#1e293b",
                background: "#f1f5f9",
                margin: [8, 8, 8, 8],
                lineHeight: 1.3
            }

        },

        defaultStyle: {
            font: "Roboto"
        }

    };

    pdfMake.createPdf(documentDefinition).download("TeachMeAI-Study-Notes.pdf");

};