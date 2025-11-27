# 为本文档贡献

你可以通过在 [GitHub](https://github.com/gjxx-dev/forge-doc.gjxx.dev) 上提交一个 PR 来贡献本项目。

本文档旨在提供说明性内容。请解释如何做，并将内容分解成合理的、易于理解的部分。
我们在其他地方维护一个 wiki，用于存放更全面的代码示例。

我们的读者是任何想了解如何使用 Forge 构建模组的人。

请不要试图把本文档变成 Java 开发教程——本指南的目标读者应该已经理解 Java 类的工作方式以及 Java 的其他基础结构。

样式指南
-----------

!!! important
    请使用 **两个空格** 进行缩进，不要使用制表符（tab）。

标题应按照标准标题格式使用首字母大写。例如：

* Guide For Contributing to This Documentation
* Building and Testing Your Mod

本质上，除了不重要的词之外其它词都应大写。

拼写、语法和句法应遵循美式英语。此外，优先使用完整词组而不是缩略形式（例如使用 “are not” 而不是 “aren't”）。

请使用等号（equals）和短横线（dash）来创建下划线标题，而不是使用 `#` 和 `##`。对于 h3 及更低级别，使用 `###` 等语法是可以的。本文件的源文件包含了等号与短横线下划线的示例。等号下划线创建 h1，短横线下划线创建 h2。

当在代码块外引用字段和方法时，应使用 `#` 分隔（例如 `ClassName#methodName`）。内部类应使用 `$` 分隔（例如 `ClassName$InnerClassName`）。

JSON 代码块应使用 `js` 语法高亮。

所有链接应在页面底部指定其位置。任何内部链接应通过相对路径引用目标页面。

Admonitions（使用 `!!! <type>` 表示）必须按照文档中说明的格式进行，否则可能渲染不正确。

[GitHub]: https://github.com/MinecraftForge/Documentation
[admonition]: https://python-markdown.github.io/extensions/admonition/

