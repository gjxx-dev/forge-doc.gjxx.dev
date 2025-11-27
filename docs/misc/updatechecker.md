# Forge 更新检查器

Forge 提供了一个非常轻量、可选的更新检查框架。如果检测到某些模组有可用更新，主菜单与模组列表中的“Mods”按钮会显示一个闪烁图标，并显示相应的更新日志。该工具不会自动下载更新。

## 快速入门

首先需要在 `mods.toml` 文件中指定 `updateJSONURL` 参数。该参数的值应为一个有效的 URL，指向一个更新信息的 JSON 文件。你可以将该文件托管在自己的服务器、GitHub，或任何能被模组用户可靠访问到的地方。

更新 JSON 的格式
------------------

该 JSON 的格式相对简单，如下所示：

```js
{
  "homepage": "<homepage/download page for your mod>",
  "<mcversion>": {
    "<modversion>": "<changelog for this version>", 
    // 列出给定 Minecraft 版本下模组的所有版本，以及对应的更新日志
    // ...
  },
  "promos": {
    "<mcversion>-latest": "<modversion>",
    // 声明给定 MC 版本的“最新（bleeding-edge）”版本
    "<mcversion>-recommended": "<modversion>",
    // 声明给定 MC 版本的“推荐（stable）”版本
    // ...
  }
}
```

下面是一些注意事项：
 
* `homepage` 下的链接会在模组过期（非最新）时展示给用户。
* Forge 使用内部算法判断某个模组版本字符串是否“新于”另一个版本。大多数版本方案应兼容，但若有疑问请参考 `ComparableVersion` 类。推荐遵循 [Maven 版本规范][mvnver]。
* 更新日志字符串可以使用 `\n` 换行。有些人喜欢在 JSON 中写简短的变更摘要，并链接到外部站点以展示完整变更列表。
* 手动维护该文件可能比较麻烦。你可以在 `build.gradle` 中配置自动更新该文件（Groovy 原生支持 JSON 解析）。如何做留作练习。

- 一些示例可参考：[nocubes][], [Forge][forge] 和 [Corail Tombstone][corail] 的实现。

检索更新检查结果
--------------------

可以使用 `VersionChecker#getResult(IModInfo)` 检索 Forge 更新检查的结果。你可以通过 `ModContainer#getModInfo` 获取 `IModInfo`。通过 `ModLoadingContext.get().getActiveContainer()`（在构造函数内）、`ModList.get().getModContainerById(<your modId>)` 或 `ModList.get().getModContainerByObject(<your mod instance>)` 获取 `ModContainer`。也可以使用 `ModList.get().getModContainerById(<modId>)` 获取其他模组的 `ModContainer`。返回对象有一个 `#status` 字段，用以表示版本检查的状态。

|          Status | 描述                                          |
| --------------: | :-------------------------------------------- |
|        `FAILED` | 版本检查器无法连接到提供的 URL。              |
|    `UP_TO_DATE` | 当前版本等于推荐版本。                        |
|         `AHEAD` | 当前版本如果不存在 latest，则比推荐版本更新。 |
|      `OUTDATED` | 存在新的推荐或最新版本。                      |
| `BETA_OUTDATED` | 存在新的 latest 版本。                        |
|          `BETA` | 当前版本等于或更新于 latest 版本。            |
|       `PENDING` | 请求的结果尚未完成，请稍后重试。              |

返回对象还包含目标版本以及 `update.json` 中指定的更新日志行。

[mvnver]: ../gettingstarted/versioning.md
[nocubes]: https://cadiboo.github.io/projects/nocubes/update.json
[forge]: https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json
[corail]: https://github.com/Corail31/tombstone_lite/blob/master/update.json

