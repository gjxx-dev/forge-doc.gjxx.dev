# 全局掉落修饰器（GLM）生成

可以通过继承 `GlobalLootModifierProvider` 并实现 `#start` 来为模组生成全局掉落修饰器（Global Loot Modifiers, GLMs）。每个 GLM 可通过调用 `#add` 添加，传入修饰器名称与要序列化的修饰器实例（`modifier instance`）。实现后需将提供者注册到 `DataGenerator`。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成服务器数据时运行
        event.includeServer(),
        output -> new MyGlobalLootModifierProvider(output, MOD_ID)
    );
}

// 在 GlobalLootModifierProvider#start 中
this.add("example_modifier", new ExampleModifier(
  new LootItemCondition[] {
    WeatherCheck.weather().setRaining(true).build() // 仅在下雨时生效
  },
  "val1",
  10,
  Items.DIRT
));
```

[glm]: ../../resources/server/glm.md
[instance]: ../../resources/server/glm.md#igloballootmodifier
[datagen]: ../datagen.md#data-providers
