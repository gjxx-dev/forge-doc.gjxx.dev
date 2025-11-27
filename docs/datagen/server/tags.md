# 标签生成

可以通过继承 `TagsProvider` 并实现 `#addTags` 为模组生成标签（Tags）。实现后应将提供者注册到 `DataGenerator`（参见 [datagen]）。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成服务器数据时运行
        event.includeServer(),
        // 继承自 net.minecraftforge.common.data.BlockTagsProvider
        output -> new MyBlockTagsProvider(
          output,
          event.getLookupProvider(),
          MOD_ID,
          event.getExistingFileHelper()
        )
    );
}
```

`TagsProvider`
--------------

标签提供者有两种常用的生成方式：通过 `#tag` 创建一个标签并添加对象或其它标签，或者通过 `#getOrCreateRawBuilder` 使用其它对象类型的标签数据来生成目标标签。

!!! note
    通常情况下，除非某个注册表包含其它注册表对象的表示（例如方块具有物品对应物以便在背包中获取），否则不会直接调用 `#getOrCreateRawBuilder`。

当调用 `#tag` 时，会返回一个 `TagAppender`，它是一个链式的元素消费者，用于把元素添加到标签中：

|      方法名      | 描述                                                                                                          |
| :--------------: | :------------------------------------------------------------------------------------------------------------ |
|      `add`       | 通过资源键（resource key）将对象加入标签。                                                                    |
|  `addOptional`   | 通过名称将对象加入标签；若对象不存在则在加载时跳过。                                                          |
|     `addTag`     | 将另一个标签的所有元素加入当前标签。                                                                          |
| `addOptionalTag` | 通过名称将另一个标签加入当前标签；若目标标签不存在则在加载时跳过。                                            |
|    `replace`     | 若为 `true`，会丢弃来自其它 datapack 的已加载条目；若另一个 datapack 在此之后加载，它仍会将条目追加到标签中。 |
|     `remove`     | 通过名称或键从标签中移除对象或子标签。                                                                        |

```java
// 在某个 TagProvider#addTags
this.tag(EXAMPLE_TAG)
  .add(EXAMPLE_OBJECT)
  .addOptional(ResourceLocation.fromNamespaceAndPath("othermod", "other_object"));

this.tag(EXAMPLE_TAG_2)
  .addTag(EXAMPLE_TAG)
  .remove(EXAMPLE_OBJECT);
```

!!! important
    若模组的标签软依赖（softly depend）于另一个模组的标签（即目标模组可能在运行时不存在），则应使用可选方法引用其它模组的标签，以避免在缺少目标模组时导致加载错误。

### 已有的提供者（Existing Providers）

Minecraft 提供了若干可继承的标签提供者（针对常见注册表类型），并在某些提供者中包含便捷方法以简化标签创建：

|       注册表对象类型       | 标签提供者                             |
| :------------------------: | :------------------------------------- |
|          `Block`           | `BlockTagsProvider`*                   |
|           `Item`           | `ItemTagsProvider`                     |
|        `EntityType`        | `EntityTypeTagsProvider`               |
|          `Fluid`           | `FluidTagsProvider`                    |
|        `GameEvent`         | `GameEventTagsProvider`                |
|          `Biome`           | `BiomeTagsProvider`                    |
| `FlatLevelGeneratorPreset` | `FlatLevelGeneratorPresetTagsProvider` |
|       `WorldPreset`        | `WorldPresetTagsProvider`              |
|        `Structure`         | `StructureTagsProvider`                |
|         `PoiType`          | `PoiTypeTagsProvider`                  |
|      `BannerPattern`       | `BannerPatternTagsProvider`            |
|        `CatVariant`        | `CatVariantTagsProvider`               |
|     `PaintingVariant`      | `PaintingVariantTagsProvider`          |
|        `Instrument`        | `InstrumentTagsProvider`               |
|        `DamageType`        | `DamageTypeTagsProvider`               |























































\* `BlockTagsProvider` 为 Forge 增加的 `TagsProvider`。

#### `ItemTagsProvider#copy`

由于方块具有对应的物品表示（用于在背包中获取方块），许多方块标签也应该映射为物品标签。可使用 `#copy` 方法将某个方块标签的条目复制到物品标签：

```java
// 在 ItemTagsProvider#addTags
this.copy(EXAMPLE_BLOCK_TAG, EXAMPLE_ITEM_TAG);
```

自定义标签提供者
------------------
可以通过继承 `TagsProvider` 并传入要为其生成标签的注册表键（registry key）来创建自定义标签提供者。

```java
public RecipeTypeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> registries, ExistingFileHelper fileHelper) {
  super(output, Registries.RECIPE_TYPE, registries, MOD_ID, fileHelper);
}
```

### 内在持有者标签提供者（Intrinsic Holder Tags Providers）

一种特殊的标签提供者是 `IntrinsicHolderTagsProvider`。使用该提供者创建标签时，通过 `#tag` 添加对象可以直接用对象自身（而非其键）加入标签。为此，构造函数需提供一个把对象映射为其 `ResourceKey` 的函数。

```java
// IntrinsicHolderTagsProvider 的子类示例
public AttributeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> registries, ExistingFileHelper fileHelper) {
  super(
    output,
    ForgeRegistries.Keys.ATTRIBUTES,
    registries,
    attribute -> ForgeRegistries.ATTRIBUTES.getResourceKey(attribute).get(),
    MOD_ID,
    fileHelper
  );
}
```

[tags]: ../../resources/server/tags.md
[datagen]: ../datagen.md#data-providers
[custom]: ../../concepts/registries.md#creating-custom-forge-registries
