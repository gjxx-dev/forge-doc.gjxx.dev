# 按条件加载的数据

在某些情况下，模组开发者可能希望基于另一个模组的信息包含数据驱动对象，而不需要将该模组声明为显式依赖。另一些情况可能希望当某个模组存在时替换某些条目为该模组提供的条目。这些都可以通过条件子系统（conditional subsystem）实现。

实现
---------------

当前有条件加载实现的有配方（recipes）和进度（advancements）。对于任何有条件的配方或进度，会加载一个条件到数据项的列表。如果列表中某个数据项的指定条件为真，则返回该数据项；否则该数据项被丢弃。

```js
{
  // 由于配方可能有自定义序列化器，配方需指定 type
  // 进度（advancements）不需要此项
  "type": "forge:conditional",
  
  "recipes": [ // 对于进度使用 'advancements'
    {
      // 需要检查的条件
      "conditions": [
        // 列表中的条件按 AND 组合
        {
          // 条件 1
        },
        {
          // 条件 2
        }
      ],
      "recipe": { // 进度中为 'advancement'
        // 所有条件通过时使用的配方
      }
    },
    {
      // 如果前一个失败则检查下一个条件
    },
  ]
}
```

条件加载的数据在数据生成（data generation）中也有相应的封装，可通过 `ConditionalRecipe$Builder` 与 `ConditionalAdvancement$Builder` 使用。

条件
----------

条件通过将 `type` 设置为由 [`IConditionSerializer#getID`][serializer] 指定的条件名来表示。

### 真与假（True and False）

布尔条件不包含额外数据，直接返回条件的预期值。它们分别表示为 `forge:true` 与 `forge:false`。

```js
// 某个条件
{
  // 永远返回 true（或 'forge:false' 时为 false）
  "type": "forge:true"
}
```

### Not、And 与 Or

布尔运算条件包含要运算的条件并按相应逻辑计算，分别由 `forge:not`、`forge:and` 与 `forge:or` 表示。

```js
{
  // 对存储的条件取反
  "type": "forge:not",
  "value": {
    // 一个条件
  }
}
```

```js
{
  // 将存储的条件 AND（或 'forge:or' 为 OR）在一起
  "type": "forge:and",
  "values": [
    { /* 第一个条件 */ },
    { /* 第二个条件 */ }
  ]
}
```

### Mod Loaded

`ModLoadedCondition` 当且仅当指定 id 的模组在当前应用中已加载时返回 true，表示为 `forge:mod_loaded`。

```js
{
  "type": "forge:mod_loaded",
  // 当 'examplemod' 被加载时返回 true
  "modid": "examplemod"
}
```

### Item Exists

`ItemExistsCondition` 当且仅当给定物品已在当前应用中注册时返回 true，表示为 `forge:item_exists`。

```js
{
  "type": "forge:item_exists",
  // 当 'examplemod:example_item' 已注册时返回 true
  "item": "examplemod:example_item"
}
```

### Tag Empty

`TagEmptyCondition` 当且仅当给定的物品标签中没有任何条目时返回 true，表示为 `forge:tag_empty`。

```js
{
  "type": "forge:tag_empty",
  // 当 'examplemod:example_tag' 是一个无条目的物品标签时返回 true
  "tag": "examplemod:example_tag"
}
```

创建自定义条件
--------------------------

可以通过实现 `ICondition` 及其关联的 `IConditionSerializer` 来创建自定义条件。

### ICondition

任意条件只需实现两个方法：

| 方法  | 描述                                                                                             |
| :---: | :----------------------------------------------------------------------------------------------- |
| getID | 条件的注册名。必须等价于 [`IConditionSerializer#getID`][serializer]。仅用于[数据生成][datagen]。 |
| test  | 当条件满足时返回 true。                                                                          |

!!! note
    每个 `#test` 方法都可以访问某个表示游戏状态的 `IContext`。当前仅能从注册表中获取标签（tags）。

### IConditionSerializer

序列化器需实现三个方法：

| 方法  | 描述                                                       |
| :---: | :--------------------------------------------------------- |
| getID | 条件的注册名。必须等价于 [`ICondition#getID`][condition]。 |
| read  | 从 JSON 读取条件数据。                                     |
| write | 将给定条件数据写入 JSON。                                  |

!!! note
    条件序列化器无需负责写入或读取序列化器类型，与 Minecraft 中其它序列化器实现类似。

随后应声明一个静态实例来保存已初始化的序列化器，并在注册阶段通过 `CraftingHelper#register` 注册它，可在 `RecipeSerializer` 的 `RegisterEvent` 或 `FMLCommonSetupEvent` 中完成。

```java
// 在某个序列化器类中
public static final ExampleConditionSerializer INSTANCE = new ExampleConditionSerializer();

// 在某个处理器类中
public void registerSerializers(RegisterEvent event) {
  event.register(ForgeRegistries.Keys.RECIPE_SERIALIZERS,
    helper -> CraftingHelper.register(INSTANCE)
  );
}
```

!!! important
    如果在 `FMLCommonSetupEvent` 中注册条件序列化器，必须通过 `FMLCommonSetupEvent#enqueueWork` 将注册排入同步工作队列，因为 `CraftingHelper#register` 不是线程安全的。

[datagen]: ../../datagen/server/recipes.md
[serializer]: #iconditionserializer
[condition]: #icondition

