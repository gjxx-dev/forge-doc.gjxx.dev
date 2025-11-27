# 配置

配置定义了可应用于模组实例的设置和使用者偏好。Forge 使用基于 [TOML][toml] 的配置文件，并通过 [NightConfig][nightconfig] 读取这些文件。

创建配置
------------

可以使用 `IConfigSpec` 的子类型来创建配置。Forge 通过 `ForgeConfigSpec` 实现该类型，并通过 `ForgeConfigSpec$Builder` 提供构造支持。构建器可以使用 `Builder#push` 创建一个节（section），并使用 `Builder#pop` 离开该节，从而将配置值分组。之后，可以通过两种方式之一来构建配置：

 | 方法        | 描述                                                                |
 | :---------- | :------------------------------------------------------------------ |
 | `build`     | 创建 `ForgeConfigSpec`。                                            |
 | `configure` | 创建一个包含配置值的类与对应的 `ForgeConfigSpec` 的二元组（pair）。 |

!!! note
    `ForgeConfigSpec$Builder#configure` 通常与 `static` 代码块一起使用，配合在构造函数中接收 `ForgeConfigSpec$Builder` 的类来附加并保存配置值：

    ```java
    // 在某个配置类中
    ExampleConfig(ForgeConfigSpec.Builder builder) {
      // 在 final 字段中定义值
    }

    // 在某处可以访问该构造函数
    static {
      Pair<ExampleConfig, ForgeConfigSpec> pair = new ForgeConfigSpec.Builder()
        .configure(ExampleConfig::new);
      // 将 pair 的值存入某个常量字段
    }
    ```

每个配置值可以附带额外的上下文以提供更多行为。上下文必须在配置值完全构建之前定义：

| 方法           | 描述                                                           |
| :------------- | :------------------------------------------------------------- |
| `comment`      | 提供关于该配置值用途的描述。可以传入多个字符串以形成多行注释。 |
| `translation`  | 为配置项名称提供翻译键（translation key）。                    |
| `worldRestart` | 更改该配置项后需要重启世界（world）才能生效。                  |

### ConfigValue

配置值可以使用（如果定义了）提供的上下文通过任意 `#define` 方法来构建。

所有配置值方法至少需要两个参数：

* 表示变量名称的路径：用 `.` 分隔的字符串，表示配置值所在的节
* 当没有有效配置时的默认值

`ConfigValue` 的特定方法还需要两个额外参数：

* 一个验证器（validator），用于确保反序列化后的对象有效
* 表示配置值数据类型的类

```java
// 对某个 ForgeConfigSpec$Builder builder
ConfigValue<T> value = builder.comment("Comment")
  .define("config_value_name", defaultValue);
```

可以通过 `ConfigValue#get` 获取值。为了避免多次从文件读取，值会被缓存。

#### 附加的配置值类型

* **范围值（Range Values）**
    * 描述：值必须在定义的上下限之间
    * 类类型：`Comparable<T>`
    * 方法名：`#defineInRange`
    * 附加参数：
      * 配置值允许的最小值和最大值
      * 表示配置值数据类型的类

!!! note
    `FloatValue`、`DoubleValue`、`ByteValue`、`ShortValue`、`IntValue` 和 `LongValue` 都是范围值，分别指定类为 `Float`、`Double`、`Byte`、`Short`、`Integer` 和 `Long`。

* **白名单值（Whitelisted Values）**
    * 描述：值必须在提供的集合中
    * 类类型：`T`
    * 方法名：`#defineInList`
    * 附加参数：
      * 允许的配置值集合

* **列表值（List Values）**
    * 描述：值为一组条目（列表）
    * 类类型：`List<T>`
    * 方法名：`#defineList`；如果允许为空则使用 `#defineListAllowEmpty`
    * 附加参数：
      * 用于验证列表中反序列化元素的验证器

* **枚举值（Enum Values）**
    * 描述：在提供集合中的枚举值
    * 类类型：`Enum<T>`
    * 方法名：`#defineEnum`
    * 附加参数：
      * 将字符串或整数转换为枚举的获取器（getter）
      * 允许的值集合

* **布尔值（Boolean Values）**
    * 描述：一个 `boolean` 值
    * 类类型：`Boolean`
    * 方法名：`#define`

注册配置
----------

一旦 `ForgeConfigSpec` 被构建，就必须注册它，使 Forge 能够根据需要加载、跟踪并同步配置设置。配置应在模组构造函数中通过 `ModLoadingContext#registerConfig` 注册。注册时需提供表示配置所属面的类型、`ForgeConfigSpec`，以及可选的配置文件名。

```java
// 在模组构造函数中，使用已定义的 ForgeConfigSpec CONFIG 和 FMLJavaModLoadingContext context
context.registerConfig(Type.COMMON, CONFIG);
```

以下是可用配置类型的列表：

|  Type  |      Loaded      | Synced to Client |               Client Location                |           Server Location            | Default File Suffix |
| :----: | :--------------: | :--------------: | :------------------------------------------: | :----------------------------------: | :------------------ |
| CLIENT | Client Side Only |        No        |             `.minecraft/config`              |                 N/A                  | `-client`           |
| COMMON |  On Both Sides   |        No        |             `.minecraft/config`              |       `<server_folder>/config`       | `-common`           |
| SERVER | Server Side Only |       Yes        | `.minecraft/saves/<level_name>/serverconfig` | `<server_folder>/world/serverconfig` | `-server`           |

!!! tip
    Forge 在代码库中记录了 [config types][type] 的相关信息。

配置事件
-----------

当配置被加载或重新加载时，可以使用 `ModConfigEvent$Loading` 和 `ModConfigEvent$Reloading` 事件执行相应操作。这些事件必须注册到模组事件总线（mod event bus）。

!!! warning
    这些事件会针对模组的所有配置触发；应使用提供的 `ModConfig` 对象来区分正在加载或重新加载的是哪个配置。

[toml]: https://toml.io/
[nightconfig]: https://github.com/TheElectronWill/night-config
[type]: https://github.com/MinecraftForge/MinecraftForge/blob/c3e0b071a268b02537f9d79ef8e7cd9b100db416/fmlcore/src/main/java/net/minecraftforge/fml/config/ModConfig.java#L108-L136
[events]: ../concepts/events.md#creating-an-event-handler

