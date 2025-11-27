# 掉落表（Loot Table）生成

可以通过构造一个 `LootTableProvider` 并提供 `LootTableProvider$SubProviderEntry` 列表来为模组生成掉落表（loot tables）。该提供者需注册到 `DataGenerator`。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成服务器数据时运行
        event.includeServer(),
        output -> new MyLootTableProvider(
          output,
          // 指定需要生成的表的注册名，或留空
          Collections.emptySet(),
          // 生成掉落表的子提供器列表
          List.of(subProvider1, subProvider2, /*...*/)
        )
    );
}
```

`LootTableSubProvider`
----------------------

每个 `LootTableProvider$SubProviderEntry` 包含一个 `LootTableSubProvider`，用于为特定的 `LootContextParamSet` 生成掉落表。`LootTableSubProvider` 提供了一个方法，该方法接受一个写入器（`BiConsumer<ResourceLocation, LootTable.Builder>`）来生成表。

```java
public class ExampleSubProvider implements LootTableSubProvider {

  public ExampleSubProvider() {}

  @Override
  public void generate(BiConsumer<ResourceLocation, LootTable.Builder> writer) {
    // 通过 writer.accept(location, builder) 生成掉落表
  }
}
```

在传入 `LootTableProvider` 构造函数的列表中，应为每个目标的 `LootContextParamSet` 提供对应的 `SubProviderEntry`：

```java
new LootTableProvider.SubProviderEntry(
  ExampleSubProvider::new,
  LootContextParamSets.EMPTY
)
```

### `BlockLootSubProvider` 与 `EntityLootSubProvider`

对于 `LootContextParamSets#BLOCK` 与 `#ENTITY`，提供了专用子类 `BlockLootSubProvider` 与 `EntityLootSubProvider`，它们包含便捷方法用于创建与校验掉落表。

`BlockLootSubProvider` 的构造函数接受一个表示防爆物品集合的列表（用于决定方块被爆炸时是否能生成掉落表）和一个 `FeatureFlagSet`（用于决定方块是否启用，从而生成掉落表）。

```java
public MyBlockLootSubProvider() {
  super(Collections.emptySet(), FeatureFlags.REGISTRY.allFlags());
}
```

`EntityLootSubProvider` 的构造函数接受一个 `FeatureFlagSet`，用于决定实体类型是否启用。

```java
public MyEntityLootSubProvider() {
  super(FeatureFlags.REGISTRY.allFlags());
}
```

使用这些子类时，需要将已注册对象提供给 `BlockLootSubProvider#getKnownBlocks` 或 `EntityLootSubProvider#getKnownEntityTypes`，以便确保每个已知对象都有掉落表。

!!! tip
    若使用 `DeferredRegister` 注册对象，可以通过 `DeferredRegister#getEntries` 将条目传入 `#getKnown*` 方法。

掉落表构建器（Loot Table Builders）
----------------------------------

要生成掉落表，`LootTableSubProvider` 接受 `LootTable$Builder`。构建器可指定池（pools）、条件（conditions）和修饰器（functions）。下面给出各组件的简要说明：

### LootTable
掉落表为基础对象，可通过 `LootTable#lootTable` 获取 `LootTable$Builder`。掉落表由一系列池（pools）组成，池按顺序执行，并可通过 `#apply` 添加函数来修改池的输出。

### LootPool
掉落池代表一组操作，可使用 `LootPool#lootPool` 获取 `LootPool$Builder`。每个池可添加条目（entries）、条件（when）和函数（apply），并可设置执行次数（`setRolls`）及额外执行次数（`setBonusRolls`，受运气影响）。

### LootPoolEntryContainer
掉落条目定义被选中时执行的操作，通常生成物品。每个条目都关联一个已注册的 `LootPoolEntryType`，并有相应的 builder（子类化自 `LootPoolEntryContainer$Builder`）。多个条目可并行执行（`#append`）或顺序执行（`#then`），也可在失败时回退（`#otherwise`）。

### LootItemCondition
条件定义执行操作所需满足的前置要求，每个条件对应一个已注册的 `LootItemConditionType`。默认情况下，指定的所有条件必须为真，也可以使用 `#or` 指定只需任意一项为真，或使用 `#invert` 取反条件。

### LootItemFunction
函数在条目执行后修改生成结果，每个函数对应一个已注册的 `LootItemFunctionType`。

#### NbtProvider
NBT 提供器是一类特殊的函数（例如 `CopyNbtFunction`），用于指定从何处拷贝 NBT 数据。每个提供器对应一个已注册的 `LootNbtProviderType`。

### NumberProvider
数值提供器决定池执行的次数，每种提供器对应一个已注册的 `LootNumberProviderType`。

#### ScoreboardNameProvider
计分板提供器是数值提供器的一种，用于从计分板（scoreboard）读取执行次数。对应的类型为 `LootScoreProviderType`。

[loottable]: ../../resources/server/loottables.md
[datagen]: ../index.md#data-providers
[registered]: ../../concepts/registries.md#registries-that-arent-forge-registries
