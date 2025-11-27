# 全局战利品修饰器（Global Loot Modifiers）

全局战利品修饰器（GLM）是一种数据驱动的方法，用于在不需要覆盖大量原版战利品表的情况下修改掉落，或在需要与其他模组的战利品表交互但无法确定哪些模组已加载时处理相关效果。全局战利品修饰器是可堆叠的（stacking），而非后加载覆盖（last-load-wins），这点类似于标签。

注册全局战利品修饰器
-------------------------------

你需要准备四样东西：

1. 创建 `global_loot_modifiers.json`。
    * 该文件告知 Forge 你的修饰器，类似于 [tags]。
2. 一个序列化的 JSON，表示你的修饰器。
    * 该文件包含修饰器的数据，使数据包可以调整该效果。
3. 一个继承 `IGlobalLootModifier` 的类。
    * 实际执行修饰功能的代码。大多数开发者可以继承 `LootModifier` 以获得基础功能。
4. 一个用于对你的运行时类进行编码/解码的 codec。
    * 该 codec 与其他 `IForgeRegistryEntry` 一样进行[注册]。

`global_loot_modifiers.json`
-------------------------------

`global_loot_modifiers.json` 表示将被加载到游戏中的所有修饰器。该文件**必须**放在 `data/forge/loot_modifiers/global_loot_modifiers.json`。

!!! important
    `global_loot_modifiers.json` 仅在 `forge` 命名空间下被读取，若放在模组自身命名空间将被忽略。

`entries` 是一个*有序列表*，指明将被加载的修饰器。指定的 [ResourceLocation][resloc] 指向 `data/<namespace>/loot_modifiers/<path>.json` 中的对应条目。这对于数据包作者解决来自不同模组的修饰器冲突尤为重要。

当 `replace` 为 true 时，行为从将修饰器追加到全局列表改为完全替换全局列表。为了与其它模组实现兼容，模组通常应使用 `false`。

```js
{
  "replace": false,
  "entries": [
    "examplemod:example_glm",
    "examplemod:example_glm2"
  ]
}
```

序列化的 JSON
-------------------------------

该文件包含与你的修饰器相关的所有变量，包括使修饰器生效所需的条件。应尽量避免硬编码值，以便数据包作者可以根据需要调整平衡。

`type` 表示用于读取该 JSON 文件的 [codec] 的注册名，必须始终存在。

`conditions` 表示修饰器生效的战利品表条件。为了允许数据包作者灵活调整条件，应避免硬编码。这一项也必须存在。

!!! important
    虽然 `conditions` 应表明修饰器生效的条件，但当使用 Forge 提供的 `LootModifier` 子类时，所有条件将被 **AND** 连接并检查以决定是否应用修饰器。

可以在 JSON 中指定序列化器与修饰器定义的其它属性。

```js
{
  "type": "examplemod:example_loot_modifier",
  "conditions": [ /*...*/ ],
  "prop1": "val1",
  "prop2": 10,
  "prop3": "minecraft:dirt"
}
```

`IGlobalLootModifier`
---------------------

要提供全局战利品修饰器的功能，必须实现 `IGlobalLootModifier`。每当序列化器从 JSON 解码信息时，会生成该实现的一个实例。

需要定义两个方法：`#apply` 与 `#codec`。`#apply` 接受当前将被生成的战利品列表及上下文（例如所在关卡等），并返回最终要生成的掉落列表。

!!! note
    单个修饰器返回的掉落列表会按注册顺序依次传递给其它修饰器，因此已被修改的掉落仍可能被后续修饰器再次修改。

`#codec` 返回用于将修饰器与 JSON 编码/解码的注册 codec。

### `LootModifier` 子类

`LootModifier` 是 `IGlobalLootModifier` 的抽象实现，提供了大多数开发者可以继承的基础功能。其实现中需注意构造函数（接受 `LootItemCondition[]`）以及 `#doApply` 方法。

构造函数所传入的 `LootItemCondition[]` 数组表示在应用修饰器前必须满足的条件；这些条件会被 **AND** 组合。

`#doApply` 的行为类似于 `#apply`，但仅在所有条件为真时执行。

```java
public class ExampleModifier extends LootModifier {

  public ExampleModifier(LootItemCondition[] conditionsIn, String prop1, int prop2, Item prop3) {
    super(conditionsIn);
    // 存储其它参数
  }

  @NotNull
  @Override
  protected ObjectArrayList<ItemStack> doApply(ObjectArrayList<ItemStack> generatedLoot, LootContext context) {
    // 修改并返回新的掉落
  }

  @Override
  public Codec<? extends IGlobalLootModifier> codec() {
    // 返回用于编码/解码的 codec
  }
}
```

Loot 修饰器的 Codec
-----------------------

连接 JSON 与 `IGlobalLootModifier` 实例的是 [`Codec<T>`][codecdef]，其中 `T` 表示 `IGlobalLootModifier` 的类型。

为方便使用，提供了一个战利品条件 codec，可通过 `LootModifier#codecStart` 将其加入记录式 codec（record-like codec），该方式对关联修饰器的数据生成（data generation）十分有用。

```java
public static final RegistryObject<Codec<ExampleModifier>> = REGISTRAR.register("example_codec", () ->
  RecordCodecBuilder.create(
    inst -> LootModifier.codecStart(inst).and(
      inst.group(
        Codec.STRING.fieldOf("prop1").forGetter(m -> m.prop1),
        Codec.INT.fieldOf("prop2").forGetter(m -> m.prop2),
        ForgeRegistries.ITEMS.getCodec().fieldOf("prop3").forGetter(m -> m.prop3)
      )
    ).apply(inst, ExampleModifier::new)
  )
);
```

[Examples][examples] 可在 Forge Git 仓库中找到，包括丝绸之触（silk touch）与熔炼（smelting）效果的示例。

[tags]: ./tags.md
[resloc]: ../../concepts/resources.md#ResourceLocation
[codec]: #the-loot-modifier-codec
[registered]: ../../concepts/registries.md#methods-for-registering
[codecdef]: ../../datastorage/codecs.md
[datagen]: ../../datagen/server/glm.md
[examples]: https://github.com/MinecraftForge/MinecraftForge/blob/1.20.x/src/test/java/net/minecraftforge/debug/gameplay/loot/GlobalLootModifiersTest.java

