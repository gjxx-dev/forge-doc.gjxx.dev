# 语言文件生成

可以通过继承 `LanguageProvider` 并实现 `#addTranslations` 来为模组生成语言文件（language files）。每个 `LanguageProvider` 子类代表一种语言环境（例如 `en_us` 表示美式英语，`es_es` 表示西班牙语等）。实现后需将提供者 [添加][datagen] 到 `DataGenerator`。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成客户端资源时运行
        event.includeClient(),
        // 为美式英语添加本地化
        output -> new MyLanguageProvider(output, MOD_ID, "en_us")
    );
}
```

`LanguageProvider`
------------------

每个语言提供者实质上是一个键值映射（translation map），把翻译键映射到本地化文本。可通过 `#add` 添加翻译键映射。此外，类中还提供了针对 `Block`、`Item`、`ItemStack`、`Enchantment`、`MobEffect` 与 `EntityType` 的便捷方法。

```java
// 在 LanguageProvider#addTranslations 中
this.addBlock(EXAMPLE_BLOCK, "示例方块");
this.add("object.examplemod.example_object", "示例对象");
```

!!! tip
    包含非美式英语字母（例如带重音符号）的本地化字符串可以直接提供，生成器会自动将字符转为游戏可识别的 unicode 编码形式。

    ```java
    // 将被编码为 'Example with a d\u00EDacritic'
    this.addItem("example.diacritic", "Example with a díacritic");
    ```

[datagen]: ../index.md#data-providers
[lang]: ../../concepts/internationalization.md
[locale]: https://minecraft.wiki/w/Language#Languages