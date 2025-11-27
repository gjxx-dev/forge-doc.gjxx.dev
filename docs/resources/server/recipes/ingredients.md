# 材料（Ingredients）

`Ingredient` 是用于物品型输入的谓词（predicate）处理器，用于检查某个 `ItemStack` 是否满足作为配方输入的条件。所有需要输入的原版配方都使用 `Ingredient` 或 `Ingredient` 列表，随后这些条目会被合并为单个 `Ingredient`。

自定义材料（Custom Ingredients）
------------------

可通过在 JSON 中设置 `type` 为该材料的序列化器（ingredient serializer）的注册名来指定自定义材料（复合材料除外）。若未指定 `type`，则默认使用原版材料 `minecraft:item`。自定义材料也可方便地用于 [数据生成][datagen]。

### Forge 提供的类型

Forge 为开发者提供了若干额外的 `Ingredient` 类型以便实现更复杂的匹配行为。

#### CompoundIngredient（复合材料）

CompoundIngredient 的行为等价于“集合 OR”，即传入的堆栈只需匹配任意一个子材料即可通过。它取代了在配方中使用材料列表实现同样行为的方式，从而让自定义材料能在列表中正常工作。因为其语义类似组合列表，**无需** 指定 `type`。

```js
// 输入示例
[
  // 至少匹配其中一项
  { /* Ingredient */ },
  { "type": "examplemod:example_ingredient" } // 自定义材料
]
```

#### StrictNBTIngredient（严格 NBT 材料）

`StrictNBTIngredient` 会比较物品、耐久（damage）以及由 `IForgeItem#getShareTag` 返回的共享标签（share tags），要求完全相等。使用时将 `type` 设为 `forge:nbt`。

```js
{
  "type": "forge:nbt",
  "item": "examplemod:example_item",
  "nbt": { /* 需完全匹配的 NBT */ }
}
```

### PartialNBTIngredient（部分 NBT 材料）

`PartialNBTIngredient` 是 `StrictNBTIngredient` 的宽松版本：它仅比较指定的共享标签键（由 `IForgeItem#getShareTag` 定义）中存在的键值。使用时将 `type` 设为 `forge:partial_nbt`。

```js
{
  "type": "forge:partial_nbt",
  "item": "examplemod:example_item",
  "nbt": {
    "key1": "data1",
    "key2": { /* 数据2 */ }
  }
}
```

### IntersectionIngredient（交集材料）

`IntersectionIngredient` 表示集合 AND：传入的堆栈必须同时匹配所有子材料。至少需提供两个子材料。使用时将 `type` 设为 `forge:intersection`。

```js
{
  "type": "forge:intersection",
  "children": [ { /* 跨所有子材料均需匹配 */ }, { /* ... */ } ]
}
```

### DifferenceIngredient（差集材料）

`DifferenceIngredient` 表示集合减法（SUB）：传入堆栈必须匹配第一个材料，但不能匹配第二个材料。使用时将 `type` 设为 `forge:difference`。

```js
{
  "type": "forge:difference",
  "base": { /* 基准材料 */ },
  "subtracted": { /* 需排除的材料 */ }
}
```

创建自定义材料
----------------

要创建自定义材料，需要为对应的 `Ingredient` 子类实现 `IIngredientSerializer`。

!!! tip
    自定义材料建议继承 `AbstractIngredient`，该类提供了便捷的抽象供实现使用。

#### Ingredient 子类需要实现的方法

 |     方法      | 描述                                                                         |
 | :-----------: | :--------------------------------------------------------------------------- |
 | getSerializer | 返回用于读写该材料的 `IIngredientSerializer`。                               |
 |     test      | 若输入堆栈满足该材料则返回 true。                                            |
 |   isSimple    | 若材料仅基于物品（不检查标签）则返回 true；若需检查标签（tag），返回 false。 |

#### IIngredientSerializer

实现 `IIngredientSerializer` 子类型需实现三种方法：

 |      方法       | 描述                                       |
 | :-------------: | :----------------------------------------- |
 |  parse (JSON)   | 将 `JsonObject` 解析为 `Ingredient` 实例。 |
 | parse (Network) | 从网络缓冲区读取并解码 `Ingredient`。      |
 |      write      | 将 `Ingredient` 写入网络缓冲区。           |

另外，`Ingredient` 子类应实现 `Ingredient#toJson` 以支持 [数据生成][datagen]；`AbstractIngredient` 子类会将 `toJson` 定为抽象，需显式实现。

序列化器初始化后，应在某处将其实例注册并在合适时机调用 `CraftingHelper#register(registryName, INSTANCE)`（例如在 `RegisterEvent` 注册 `RecipeSerializer` 时，或在 `FMLCommonSetupEvent` 中；若在 `FMLCommonSetupEvent` 中注册，需通过 `enqueueWork` 入队因为该操作非线程安全）。`Ingredient#getSerializer` 应返回该序列化器的静态实例。

```java
public static final ExampleIngredientSerializer INSTANCE = new ExampleIngredientSerializer();

// 注册示例
event.register(ForgeRegistries.Keys.RECIPE_SERIALIZERS, helper -> CraftingHelper.register(registryName, INSTANCE));
```

!!! tip
    若在 `FMLCommonSetupEvent` 中注册序列化器，必须使用 `enqueueWork` 将注册请求入队（`CraftingHelper#register` 线程不安全）。

[recipes]: https://minecraft.wiki/w/Recipe#List_of_recipe_types
[nbt]: #strictnbtingredient
[serializer]: #iingredientserializer
[compound]: #compoundingredient
[datagen]: ../../../datagen/server/recipes.md
