# 进度（Advancement）生成

可以为模组生成进度（Advancements），方法是构造一个 `AdvancementProvider` 并提供若干 `AdvancementSubProvider`。进度既可以手动创建并提供，也可以使用便捷的 `Advancement$Builder` 来构建。提供者需通过 `DataGenerator#addProvider` 注册到数据生成器中（参见 [datagen]）。

!!! note
    Forge 为 `AdvancementProvider` 提供了扩展 `ForgeAdvancementProvider`，便于集成进度的生成流程。因此本节将使用 `ForgeAdvancementProvider` 及其子提供器接口 `ForgeAdvancementProvider$AdvancementGenerator`。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成服务器数据时运行
        event.includeServer(),
        output -> new ForgeAdvancementProvider(
          output,
          event.getLookupProvider(),
          event.getExistingFileHelper(),
          // 生成进度的子提供器列表
          List.of(subProvider1, subProvider2, /*...*/)
        )
    );
}
```

`ForgeAdvancementProvider$AdvancementGenerator`
-----------------------------------------------

`ForgeAdvancementProvider$AdvancementGenerator` 负责实际生成进度；它会接收注册表查找器（registry lookup）、用于写入进度的写入器（`Consumer<Advancement>`）以及 `ExistingFileHelper` 用于校验父进度是否存在。

```java
// 在某个 ForgeAdvancementProvider$AdvancementGenerator 的子类或 lambda 中

@Override
public void generate(HolderLookup.Provider registries, Consumer<Advancement> writer, ExistingFileHelper existingFileHelper) {
  // 在此处构建并 writer.accept(advancement)
}
```

`Advancement$Builder`
---------------------

`Advancement$Builder` 是用于构建要生成的 `Advancement` 的便捷工具。它允许设置父进度、显示信息、完成后的奖励以及解锁进度所需的条件。唯一必需的部分是指定解锁条件（requirements）。

常用方法包括：

|     Method     | 描述                                                                         |
| :------------: | :--------------------------------------------------------------------------- |
|    `parent`    | 指定该进度的父进度（可以用名称或直接引用已生成的进度）。                     |
|   `display`    | 设置显示用的信息（聊天、浮窗与进度界面）。                                   |
|   `rewards`    | 指定完成进度获得的奖励。                                                     |
| `addCriterion` | 向进度添加触发条件（criterion）。                                            |
| `requirements` | 指定条件的组合逻辑（全部需满足或至少一项满足），支持混合重载以实现复杂要求。 |

当 `Advancement$Builder` 配置完成后，应调用 `#save` 将进度写出，传入写入器、进度的注册名以及用于校验父进度的 `ExistingFileHelper`。

```java
// 在某个 ForgeAdvancementProvider$AdvancementGenerator#generate(registries, writer, existingFileHelper) 中
Advancement example = Advancement.Builder.advancement()
  .addCriterion("example_criterion", triggerInstance) // 解锁条件
  .save(writer, name, existingFileHelper); // 写出进度数据
```

[advancements]: ../../resources/server/advancements.md
[datagen]: ../datagen.md#data-providers
[conditional]: ../../resources/server/conditional.md
