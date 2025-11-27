# 模组文件

模组文件负责确定哪些模组会被打包进你的 JAR、在“Mods”菜单中显示哪些信息、以及模组应如何在游戏中被加载。

`mods.toml`
---------

`mods.toml` 文件定义了你模组的元数据，同时包含在“Mods”菜单中显示的额外信息以及模组应如何被加载。

该文件使用 TOML（Tom's Obvious Minimal Language）格式。文件必须存放在资源目录的 `META-INF` 下（即对于 `main` 源集为 `src/main/resources/META-INF/mods.toml`）。`mods.toml` 的示例如下：

```toml
modLoader="javafml"
loaderVersion="[52,)"

license="All Rights Reserved"
issueTrackerURL="https://github.com/MinecraftForge/MinecraftForge/issues"
showAsResourcePack=false
clientSideOnly=false

[[mods]]
  modId="examplemod"
  version="1.0.0.0"
  displayName="Example Mod"
  updateJSONURL="https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json"
  displayURL="https://minecraftforge.net"
  logoFile="logo.png"
  credits="I'd like to thank my mother and father."
  authors="Author"
  description='''
  Lets you craft dirt into diamonds. This is a traditional mod that has existed for eons. It is ancient. The holy Notch created it. Jeb rainbowfied it. Dinnerbone made it upside down. Etc.
  '''
  displayTest="MATCH_VERSION"

[[dependencies.examplemod]]
  modId="forge"
  mandatory=true
  versionRange="[52,)"
  ordering="NONE"
  side="BOTH"

[[dependencies.examplemod]]
  modId="minecraft"
  mandatory=true
  versionRange="[1.21.1,)"
  ordering="NONE"
  side="BOTH"
```

`mods.toml` 分为三部分：与 JAR 本身相关的非模组特定属性（用于控制如何加载模组及全局元数据）、模组特定属性（每个 `[[mods]]` 头部对应一个模组）、以及依赖配置（每个模组可能有一节依赖配置）。下文将解释各字段，其中 `required` 表示必须提供该值，否则会抛出异常。

### 非模组特定属性

这些属性与 JAR 本身相关，指示如何加载模组及其它全局元数据。

| 属性名               |  类型   |   默认   |                                                                                   描述                                                                                    | 示例                                                            |
| :------------------- | :-----: | :------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------- |
| `modLoader`          | string  | **必填** |            指定使用哪种语言加载器（language loader），可用于支持不同语言结构（例如 Kotlin）或不同的入口点查找方式。Forge 提供 `"javafml"` 与 `"lowcodefml"`。             | `"javafml"`                                                     |
| `loaderVersion`      | string  | **必填** |                           语言加载器可接受的版本范围，使用 Maven 版本范围表达式。对 `javafml` 与 `lowcodefml`，版本通常对应 Forge 的主版本号。                            | `"[46,)"`                                                       |
| `license`            | string  | **必填** |                                                        指定模组的许可证，建议使用 SPDX 标识符或指向许可证的链接。                                                         | `"MIT"`                                                         |
| `showAsResourcePack` | boolean | `false`  |                                         为 `true` 时，将把模组资源在“资源包”菜单中作为单独资源包显示，而不是合并到“模组资源”中。                                          | `true`                                                          |
| `clientSideOnly`     | boolean | `false`  |                           为 `true` 时，运行在专用服务器上将跳过加载 mods.toml 中声明的所有模组，并在客户端运行时为其设置正确的 `displayTest`。                           | `true`                                                          |
| `services`           |  array  |   `[]`   | 指定模组使用的服务数组（用于 Forge 基于 Java 平台模块系统创建的模块）。该字段已不推荐，推荐使用标准 Java 服务声明方式（service 文件或 module-info.java 的 `uses` 指令）。 | `["net.minecraftforge.forgespi.language.IModLanguageProvider"]` |
| `properties`         |  table  |   `{}`   |                用于字符串替换的属性表，`StringSubstitutor` 会用 `${file.<key>}` 替换对应值，目前主要用于替换 `[mod-specific properties]` 中的 `version`。                 | `{ "example" = "1.2.3" }`                                       |
| `issueTrackerURL`    | string  |   *无*   |                                                                    指向模组问题反馈与跟踪页面的 URL。                                                                     | `"https://forums.minecraftforge.net/"`                          |

!!! important
    `services` 字段在功能上等价于 `module-info.java` 中的 `uses` 指令，这允许通过服务加载（service loading）查找给定类型的实现。

### 模组特定属性

模组特定属性绑定到 `[[mods]]` 表头下，是一个表数组（array of tables）。每个表内的键值都会附加到当前模组，直到下一个 `[[mods]]` 表头出现。

| 属性            |  类型   |          默认           |                                                         描述                                                          | 示例                                                          |
| :-------------- | :-----: | :---------------------: | :-------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------ |
| `modId`         | string  |        **必填**         |  模组的唯一标识符，必须匹配 `^[a-z][a-z0-9_]{1,63}$`（2-64 字符，首字符为小写字母，可包含小写字母、数字或下划线）。   | `"examplemod"`                                                |
| `namespace`     | string  |     默认为 `modId`      |                                          覆盖命名空间（目前未被广泛使用）。                                           | `"example"`                                                   |
| `version`       | string  |          `"1"`          | 模组版本，建议使用 Maven 风格的扩展版本格式；可使用 `${file.jarVersion}` 从 JAR 清单中读取 `Implementation-Version`。 | `"1.21.1-1.0.0.0"`                                            |
| `displayName`   | string  |     默认为 `modId`      |                                          模组的显示名称（用于模组列表等）。                                           | `"Example Mod"`                                               |
| `description`   | string  | `"MISSING DESCRIPTION"` |                                        模组描述（建议使用多行字面量字符串）。                                         | `"This is an example."`                                       |
| `logoFile`      | string  |          *无*           |             在模组列表屏幕使用的图像文件名，需放在 JAR 根目录或源集根目录（例如 `src/main/resources`）。              | `"example_logo.png"`                                          |
| `logoBlur`      | boolean |         `true`          |                        是否使用线性过滤渲染 logo（true：`GL_LINEAR*`，false：`GL_NEAREST*`）。                        | `false`                                                       |
| `updateJSONURL` | string  |          *无*           |                                   用于更新检查器的 JSON URL，以确认模组是否为最新。                                   | `"https://files.minecraftforge.net/.../promotions_slim.json"` |
| `features`      |  table  |          `{}`           |                                                  见“features”小节。                                                   | `{ java_version = "17" }`                                     |
| `modproperties` |  table  |          `{}`           |                          与该模组关联的键值表，当前由 Forge 未直接使用，主要供模组自行使用。                          | `{ example = "value" }`                                       |
| `modUrl`        | string  |          *无*           |                                         模组下载页面 URL（未被 Forge 使用）。                                         | `"https://files.minecraftforge.net/"`                         |
| `credits`       | string  |          *无*           |                                             在模组列表中显示的鸣谢信息。                                              | `"The person over here and there."`                           |
| `authors`       | string  |          *无*           |                                                    模组作者信息。                                                     | `"Example Person"`                                            |
| `displayURL`    | string  |          *无*           |                                           在模组列表中显示的模组页面 URL。                                            | `"https://minecraftforge.net/"`                               |
| `displayTest`   | string  |    `"MATCH_VERSION"`    |                                                     见 [sides]。                                                      | `"NONE"`                                                      |

#### Features

Features 机制允许模组声明在加载时必须满足的某些设置、软件或硬件条件。若不满足，模组加载会失败并提示用户。当前 Forge 提供的 features 示例：

|    Feature     |                                     描述                                     | 示例      |
| :------------: | :--------------------------------------------------------------------------: | :-------- |
| `java_version` | 可接受的 Java 版本范围，使用 Maven 版本范围表达式，应与 Minecraft 要求相符。 | `"[17,)"` |

### 依赖配置

模组可在 `mods.toml` 中声明依赖项，Forge 在加载模组前会检查这些依赖项。依赖使用 `[[dependencies.<modid>]]`（表数组）形式定义，其中 `<modid>` 为依赖所属的模组 id。

| 属性           |  类型   |   默认   |                                   描述                                   | 示例                             |
| :------------- | :-----: | :------: | :----------------------------------------------------------------------: | :------------------------------- |
| `modId`        | string  | **必填** |                         作为依赖添加的模组 id。                          | `"example_library"`              |
| `mandatory`    | boolean | **必填** |                     若未满足该依赖，游戏是否应崩溃。                     | `true`                           |
| `versionRange` | string  |   `""`   |          可接受的版本范围（Maven 风格）。空字符串匹配任意版本。          | `"[1,2)"`                        |
| `ordering`     | string  | `"NONE"` | 定义依赖加载顺序：`"BEFORE"` 或 `"AFTER"`，若不关心顺序则使用 `"NONE"`。 | `"AFTER"`                        |
| `side`         | string  | `"BOTH"` |        依赖必须存在的物理侧：`"CLIENT"`、`"SERVER"` 或 `"BOTH"`。        | `"CLIENT"`                       |
| `referralUrl`  | string  |   *无*   |                     依赖的下载页面 URL（未被使用）。                     | `"https://library.example.com/"` |

!!! warning
    两个模组之间不当的 `ordering` 可能导致循环依赖并使加载崩溃，例如 A 要在 B 之前加载，而 B 又要求在 A 之前加载。

入口点（Mod Entrypoints）
---------------

在填写 `mods.toml` 后，需要为模组提供入口点（entrypoint）以开始执行模组逻辑。入口点取决于 `mods.toml` 中所指定的语言加载器。

### `javafml` 与 `@Mod`

`javafml` 是 Forge 为 Java 提供的语言加载器。使用 `@Mod` 注解的公共类作为入口点，`@Mod` 的值必须包含在 `mods.toml` 中声明的某个 mod id。初始化逻辑（例如 [注册事件][events]、添加 `DeferredRegister`）通常在该类的构造函数中执行。模组事件总线可通过 `FMLJavaModLoadingContext` 获取并在构造参数中使用。

```java
@Mod("examplemod") // 必须与 mods.toml 中的 modId 匹配
public class Example {

  public Example(FMLJavaModLoadingContext context) {
    // 在此处初始化逻辑
    var modBus = context.getModEventBus();

    // ...
  }
}
```

### `lowcodefml`

`lowcodefml` 是一种用于将数据包和资源包作为模组发布但无需在代码中编写入口点的语言加载器（保留了在将来做少量扩展的余地）。

[toml]: https://toml.io/
[mvr]: https://maven.apache.org/enforcer/enforcer-rules/versionRanges.html
[spdx]: https://spdx.org/licenses/
[modsp]: #mod-specific-properties
[uses]: https://docs.oracle.com/javase/specs/jls/se17/html/jls-7.html#jls-7.7.3
[serviceload]: https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/ServiceLoader.html#load(java.lang.Class)
[array]: https://toml.io/en/v1.0.0#array-of-tables
[mvnver]: ./versioning.md
[multiline]: https://toml.io/en/v1.0.0#string
[update]: ../misc/updatechecker.md
[features]: #features
[sides]: ../concepts/sides.md#writing-one-sided-mods
[dist]: ../concepts/sides.md#different-kinds-of-sides
[events]: ../concepts/events.md
[registration]: ../concepts/registries.md#deferredregister
