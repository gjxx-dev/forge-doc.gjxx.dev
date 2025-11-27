# 声音定义生成

可以通过继承 `SoundDefinitionsProvider` 并实现 `#registerSounds` 来为模组生成 `sounds.json`。实现后需将该提供者 [添加][datagen] 到 `DataGenerator`。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成客户端资源时运行
        event.includeClient(),
        output -> new MySoundDefinitionsProvider(output, MOD_ID, event.getExistingFileHelper())
    );
}
```

添加声音（Adding a Sound）
-------------------------
可通过 `#add` 指定声音名称与定义来生成声音条目。声音名称可以来自 `SoundEvent`、`ResourceLocation` 或直接使用字符串。

!!! warning
    提供的声音名称会默认使用构造器中传入的模组 id 作为命名空间；该命名空间不会进行额外校验，请注意不要误用其它命名空间。

### `SoundDefinition`
`SoundDefinition` 可通过 `#definition` 创建，包含定义某个声音实例所需的数据。

该定义常用的方法：

|   Method   | 描述                                                            |
| :--------: | :-------------------------------------------------------------- |
|   `with`   | 添加一个或多个可能被播放的声音条目。                            |
| `subtitle` | 设置该定义对应的字幕（翻译键）。                                |
| `replace`  | 当为 `true` 时，替换其他 `sounds.json` 已定义的声音而不是追加。 |

### `SoundDefinition$Sound`
通过 `SoundDefinitionsProvider#sound` 方法可以为 `SoundDefinition` 添加单个 `Sound`，该方法接受声音引用和可选的 `SoundType`。

`SoundType` 有两种值：

| Sound Type | 含义                                                         |
| :--------: | :----------------------------------------------------------- |
|  `SOUND`   | 指向 `assets/<namespace>/sounds/<path>.ogg` 的声音文件引用。 |
|  `EVENT`   | 指向 `sounds.json` 中已定义的另一个声音名。                  |

每个通过 `SoundDefinitionsProvider#sound` 创建的 `Sound` 可设置下列加载与播放配置：

|        Method         | 描述                                                                          |
| :-------------------: | :---------------------------------------------------------------------------- |
|       `volume`        | 设置音量比例（必须大于 0）。                                                  |
|        `pitch`        | 设置音高比例（必须大于 0）。                                                  |
|       `weight`        | 设置该声音在被选中播放时的权重概率。                                          |
|       `stream`        | 若为 `true`，从文件流读取而非全部加载到内存，适合长音乐（背景音乐、唱片等）。 |
| `attenuationDistance` | 设置声音可被听见的方块范围。                                                  |
|       `preload`       | 若为 `true`，在资源包加载时立即把声音加载到内存中。                           |

```java
// 在某个 SoundDefinitionsProvider#registerSounds 中
this.add(EXAMPLE_SOUND_EVENT, definition()
  .subtitle("sound.examplemod.example_sound") // 设置字幕翻译键
  .with(
    sound(ResourceLocation.fromNamespaceAndPath(MODID, "example_sound_1")) // 第一个声音
      .weight(4) // 4 / 5 的概率播放
      .volume(0.5), // 音量缩放为 0.5
    sound(ResourceLocation.fromNamespaceAndPath(MODID, "example_sound_2")) // 第二个声音
      .stream() // 以流方式播放
  )
);

this.add(EXAMPLE_SOUND_EVENT_2, definition()
  .subtitle("sound.examplemod.example_sound")
  .with(
    sound(EXAMPLE_SOUND_EVENT.getLocation(), SoundType.EVENT) // 从已定义事件引入声音
      .pitch(0.5) // 音高缩放为 0.5
  )
);
```

[datagen]: ../index.md#data-providers
[soundevent]: ../../gameeffects/sounds.md#creating-sound-events
