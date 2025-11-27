# 国际化与本地化

国际化（Internationalization，简称 i18n）是一种编写代码的方式，使其在不修改代码的情况下适配不同语言。 本地化（Localization）是将显示文本适配到用户语言的过程。

i18n 通过“翻译键”（translation keys）来实现。翻译键是一个标识可显示文本的字符串，不对应任何具体语言。例如，`block.minecraft.dirt` 是指代 Dirt 方块名称的翻译键。通过使用翻译键，显示文本可以与具体语言解耦，代码本身无需为新的语言做改动。

本地化发生在游戏的区域设置（locale）中。在 Minecraft 客户端，区域设置由语言设置决定；在专用服务器上，唯一支持的区域设置是 `en_us`。可用语言列表见 [Minecraft Wiki][langs]。

语言文件
--------------

语言文件位于 `assets/[namespace]/lang/[locale].json`（例如 `examplemod` 的所有美式英文翻译位于 `assets/examplemod/lang/en_us.json`）。文件格式是从翻译键到文本值的简单 JSON 映射，文件必须使用 UTF-8 编码。旧的 `.lang` 文件可以用一个 [转换器][converter] 转为 JSON。

```js
{
  "item.examplemod.example_item": "Example Item Name",
  "block.examplemod.example_block": "Example Block Name",
  "commands.examplemod.examplecommand.error": "Example Command Errored!"
}
```

与方块与物品的使用
---------------------------

`Block`、`Item` 以及一些其他 Minecraft 类内置了用于显示名称的翻译键。这些翻译键通过重写 `#getDescriptionId` 来指定。`Item` 还有 `#getDescriptionId(ItemStack)`，可以根据 `ItemStack` 的 NBT 返回不同的翻译键。

默认情况下，`#getDescriptionId` 会返回以 `block.` 或 `item.` 为前缀并将注册名中的冒号替换为点的字符串。`BlockItem` 会默认重写此方法以使用对应 `Block` 的翻译键。例如，ID 为 `examplemod:example_item` 的物品在语言文件中需要如下条目：

```js
{
  "item.examplemod.example_item": "Example Item Name"
}
```

!!! note
    翻译键的唯一目的是支持国际化。不要用它们来决定程序逻辑，请使用注册名（registry names）。

本地化方法
--------------------

!!! warning
    一个常见的问题是让服务器为客户端做本地化。服务器只能使用它自身的区域设置进行本地化，这不一定与连接的客户端的语言设置一致。
    
    为了尊重客户端的语言设置，服务器应让客户端在其自身区域设置下本地化文本，方法是使用 `TranslatableComponent` 或其他保留语言中立翻译键的方式。

### `net.minecraft.client.resources.language.I18n`（仅客户端可用）

**该 I18n 类仅存在于 Minecraft 客户端！** 它仅供在客户端执行的代码使用。尝试在服务器上调用它将抛出异常并导致崩溃。

- `get(String, Object...)`：在客户端区域设置下进行本地化并支持格式化。第一个参数是翻译键，后续参数是传递给 `String.format(String, Object...)` 的格式化参数。

### `TranslatableContents`

`TranslatableContents` 是一种延迟本地化与格式化的 `ComponentContents`。当向玩家发送消息时非常有用，因为它会在客户端自动按客户端本地化。

`TranslatableContents(String, Object...)` 构造函数的第一个参数是翻译键，后续参数用于格式化。支持的格式化占位符仅有 `%s` 与 `%1$s`, `%2$s`, `%3$s` 等。格式化参数可以是 `Component`，它们会以完整属性被插入到最终格式化文本中。

可以通过传入 `TranslatableContents` 的参数使用 `Component#translatable` 创建一个 `MutableComponent`；也可以直接使用 `MutableComponent#create` 并传入 `ComponentContents` 本身来创建。

### `TextComponentHelper`

- `createComponentTranslation(CommandSource, String, Object...)`：根据接收者创建一个本地化且已格式化的 `MutableComponent`。若接收者是原版客户端，则本地化与格式化会被立即执行；否则会延迟，返回包含 `TranslatableContents` 的 `Component`。当服务器需要允许原版客户端直接连入时，这个方法特别有用。

[langs]: https://minecraft.wiki/w/Language#Languages
[converter]: https://tterrag.com/lang2json/
