# 物品（Items）

与方块一样，物品是大多数模组的重要组成部分。方块构成世界，而物品存在于玩家的物品栏和容器中。

创建物品
--------

### 基础物品

对于不需要特殊功能的基础物品（例如木棍或糖），无需自定义类。可以通过实例化 `Item` 并传入 `Item$Properties` 对象来创建物品，并通过调用其方法进行定制，例如：

| 方法               | 描述                                                                      |
| :----------------- | :------------------------------------------------------------------------ |
| `requiredFeatures` | 设置在该 `CreativeModeTab` 中显示该物品所需的 `FeatureFlag`。             |
| `durability`       | 设置物品最大耐久。若大于 0，则会添加 `damaged` 与 `damage` 两个物品属性。 |
| `stacksTo`         | 设置最大堆叠数。物品不能同时既可损坏又可堆叠。                            |
| `setNoRepair`      | 使该物品无法修复（即便可损坏）。                                          |
| `craftRemainder`   | 设置物品的容器物品（例如熔岩桶使用后返还空桶）。                          |

上述方法支持链式调用（返回 `this`），便于连续调用。

### 高级物品

如需更复杂行为，应继承 `Item` 并重写相应方法。

创造模式标签（Creative Tabs）
-----------------------------

可通过在模组事件总线上监听 `BuildCreativeModeTabContentsEvent` 将物品添加到 `CreativeModeTab`，使用 `event.accept` 可在无需额外配置的情况下添加物品或物品集合：

```java
@SubscribeEvent
public void buildContents(BuildCreativeModeTabContentsEvent event) {
  if (event.getTabKey() == CreativeModeTabs.INGREDIENTS) {
    event.accept(ITEM);
    event.accept(BLOCK); // 接受 ItemLike，假定方块已注册对应物品
  }
}
```

可通过 `FeatureFlag` 或权限布尔值控制是否将物品添加到创造模式标签中。

自定义创造标签
---------------

自定义 `CreativeModeTab` 必须被[注册][registering]，可通过 `CreativeModeTab#builder` 构建器设置标题、图标、默认显示物品等属性，Forge 还提供额外方法以自定义标签图片、标签文字和槽位颜色以及排序位置等。

```java
public static final RegistryObject<CreativeModeTab> EXAMPLE_TAB = REGISTRAR.register("example", () -> CreativeModeTab.builder()
  .title(Component.translatable("item_group." + MOD_ID + ".example"))
  .icon(() -> new ItemStack(ITEM.get()))
  .displayItems((params, output) -> {
    output.accept(ITEM.get());
    output.accept(BLOCK.get());
  })
  .build()
);
```

注册物品
-------

物品必须被[注册][registering]才能生效。

[modbus]: ../concepts/events.md#mod-event-bus
[registering]: ../concepts/registries.md#methods-for-registering
# 物品（Items）
================

与方块一样，物品是大多数模组的重要组成部分。方块构成你周围的世界，而物品存在于玩家的物品栏和容器中。

创建物品
--------

### 基础物品

对于不需要特殊功能的基础物品（例如木棍或糖），不必创建自定义类。可以通过实例化 `Item` 类并传入 `Item$Properties` 对象来创建物品。该 `Item$Properties` 可在构造时创建，并通过调用其方法进行定制，例如：

| 方法               | 描述                                                                          |
| :----------------- | :---------------------------------------------------------------------------- |
| `requiredFeatures` | 设置在指定 `CreativeModeTab` 中显示该物品所需的 `FeatureFlag`。               |
| `durability`       | 设置物品的最大耐久值。若大于 0，则会添加两个物品属性：`damaged` 与 `damage`。 |
| `stacksTo`         | 设置最大堆叠数量。一个物品不能同时可损坏且可堆叠。                            |
| `setNoRepair`      | 使该物品无法修复（即便它是可损坏的）。                                        |
| `craftRemainder`   | 设置物品的容器物品（如熔岩桶使用后返还空桶的行为）。                          |

上述方法均支持链式调用（返回 `this`），便于连续调用。

### 高级物品

如需更复杂的物品行为，应继承 `Item` 并覆盖相应方法。

创造标签（Creative Tabs）
-------------------------

可通过在模组事件总线上监听 `BuildCreativeModeTabContentsEvent` 将物品添加到 `CreativeModeTab`。使用 `event.accept` 可在无需额外配置的情况下添加物品（或物品集合）：

```java
// 在 MOD 事件总线上注册
// 假设有 RegistryObject<Item> 和 RegistryObject<Block> 分别为 ITEM 与 BLOCK
@SubscribeEvent
public void buildContents(BuildCreativeModeTabContentsEvent event) {
  // 添加到材料（ingredients）标签
  if (event.getTabKey() == CreativeModeTabs.INGREDIENTS) {
    event.accept(ITEM);
    event.accept(BLOCK); // 接受 ItemLike，假定方块已有对应注册物品
  }
}
```

也可以通过 `FeatureFlag` 或基于权限的布尔值来控制物品是否应被添加到创造模式标签中。

### 自定义创造标签

自定义 `CreativeModeTab` 需要被[注册][registering]。可通过 `CreativeModeTab#builder` 构建器创建面板，设置标题、图标、默认显示物品和其它属性。Forge 提供额外的方法用于自定义标签的图片、标签文本和槽位颜色，以及标签的排序位置等。

```java
// 假设有 DeferredRegister<CreativeModeTab> REGISTRAR
// 假设有 RegistryObject<Item> 和 RegistryObject<Block> 分别为 ITEM 与 BLOCK
public static final RegistryObject<CreativeModeTab> EXAMPLE_TAB = REGISTRAR.register("example", () -> CreativeModeTab.builder()
  // 设置显示名称
  .title(Component.translatable("item_group." + MOD_ID + ".example"))
  // 设置图标
  .icon(() -> new ItemStack(ITEM.get()))
  // 设置默认显示物品
  .displayItems((params, output) -> {
    output.accept(ITEM.get());
    output.accept(BLOCK.get());
  })
  .build()
);
```

注册物品
--------

物品必须被[注册][registering]才能生效。

[modbus]: ../concepts/events.md#mod-event-bus
[registering]: ../concepts/registries.md#methods-for-registering

