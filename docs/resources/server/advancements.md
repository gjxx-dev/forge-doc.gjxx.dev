# 进度（Advancements）

进度是玩家可以达成的任务，通常用于推进游戏进程。进度可以基于玩家参与的任意动作触发。

原版中的所有进度实现均为数据驱动（JSON）。这意味着仅需一个[数据包][datapack]即可创建新进度，而不必编写模组代码。关于如何创建并将这些进度放入模组 `resources` 的完整说明请见 [Minecraft Wiki][wiki]。此外，进度也可以根据可用信息（如模组是否加载、物品是否存在等）[按条件加载与默认化][conditional]。

进度条件（Advancement Criteria）
--------------------

要解锁某个进度，必须满足其指定的条件（criteria）。条件通过触发器（triggers）跟踪，在发生特定动作时触发：击杀实体、变更物品栏、动物繁殖等。每次进度被加载到游戏时，会将定义的条件读取并添加为触发器的监听器。随后，当触发器函数（通常名为 `#trigger`）被调用时，会检查所有监听器，判断当前状态是否满足进度条件。只有当完成所有要求后，进度的条件监听器才会被移除。

要求在 JSON 中以字符串数组的数组表示，表示要满足的条件名称。只要其中一个字符串数组完全满足，该进度即被完成：

```js
// 在某个进度 JSON 中

"criteria": {
  "example_criterion1": { /*...*/ },
  "example_criterion2": { /*...*/ },
  "example_criterion3": { /*...*/ },
  "example_criterion4": { /*...*/ }
},

// 该进度在以下情况之一达成：
// - Criteria1 AND Criteria2
// OR
// - Criteria3 AND Criteria4
"requirements": [
  [ "example_criterion1", "example_criterion2" ],
  [ "example_criterion3", "example_criterion4" ]
]
```

原版定义的条件触发器列表可在 `CriteriaTriggers` 中找到，JSON 格式等说明可见于 [Minecraft Wiki][triggers]。

### 自定义条件触发器（Custom Criteria Triggers）

可以通过为创建的 `AbstractCriterionTriggerInstance` 子类实现 `SimpleCriterionTrigger` 来创建自定义触发器。

### AbstractCriterionTriggerInstance 子类

`AbstractCriterionTriggerInstance` 表示 `criteria` 对象中定义的单个条件实例。触发器实例负责保存定义的条件、判断输入是否满足该条件，并为数据生成将实例写为 JSON。

通常在构造函数中传入条件。`AbstractCriterionTriggerInstance` 的父构造函数要求实例定义触发器的注册名以及作为 `ContextAwarePredicate` 的玩家条件。触发器的注册名应直接传给父构造函数，而玩家的条件应作为构造参数提供。

```java
// ID 为触发器的注册名
public ExampleTriggerInstance(ContextAwarePredicate player, ItemPredicate item) {
  super(ID, player);
  // 存储需满足的物品条件
}
```

!!! note
    一般触发器实例会提供静态工厂方法以便数据生成使用，这些静态工厂方法也可被静态导入以简化代码。

此外，应重写 `#serializeToJson` 方法，将实例的条件写入 JSON。

```java
@Override
public JsonObject serializeToJson(SerializationContext context) {
  JsonObject obj = super.serializeToJson(context);
  // 将条件写入 obj
  return obj;
}
```

最后，应添加一个方法接收当前数据并返回玩家是否满足必要条件。玩家条件通常通过 `SimpleCriterionTrigger#trigger(ServerPlayer, Predicate)` 检查。大多数实例将该方法命名为 `#matches`。

```java
// 该方法根据实例而异
public boolean matches(ItemStack stack) {
  return this.item.matches(stack);
}
```

### SimpleCriterionTrigger

`SimpleCriterionTrigger<T>`（T 为触发器实例类型）负责指定触发器的注册名、创建触发器实例并提供方法来检查触发器实例并在满足时运行监听器。

触发器的注册名由 `#getId` 提供，应与触发器实例所使用的注册名一致。

通过 `#createInstance` 从 JSON 中读取条件并创建实例：

```java
@Override
public ExampleTriggerInstance createInstance(JsonObject json, ContextAwarePredicate player, DeserializationContext context) {
  // 从 JSON 中读取条件，例如 item
  return new ExampleTriggerInstance(player, item);
}
```

随后定义一个方法来检查所有触发器实例并在条件满足时运行监听器。该方法通常接收 `ServerPlayer` 与由触发器实例匹配方法要求的其它参数，并内部调用 `SimpleCriterionTrigger#trigger`。

```java
public void trigger(ServerPlayer player, ItemStack stack) {
  this.trigger(player,
    triggerInstance -> triggerInstance.matches(stack)
  );
}
```

最后，应在 `FMLCommonSetupEvent` 中通过 `CriteriaTriggers#register` 注册该触发器实例。

!!! important
    `CriteriaTriggers#register` 必须通过 `FMLCommonSetupEvent#enqueueWork` 排入同步工作队列，因为该方法并非线程安全。

### 调用触发器

当被检查的动作执行时，应调用 `SimpleCriterionTrigger` 子类定义的 `#trigger` 方法。

```java
// 在执行动作的代码片段中
public void performExampleAction(ServerPlayer player, ItemStack stack) {
  EXAMPLE_CRITERIA_TRIGGER.trigger(player, stack);
}
```

进度奖励（Advancement Rewards）
-------------------

完成进度后可以授予奖励，包含经验、战利品表、配方（加入配方书）或以创造者（creative）玩家身份执行的函数（function）。

```js
"rewards": {
  "experience": 10,
  "loot": [ "minecraft:example_loot_table", "minecraft:example_loot_table2" ],
  "recipes": [ "minecraft:example_recipe" ],
  "function": "minecraft:example_function"
}
```

[datapack]: https://minecraft.wiki/w/Data_pack
[wiki]: https://minecraft.wiki/w/Advancement/JSON_format
[conditional]: ./conditional.md#implementations
[function]: https://minecraft.wiki/w/Function_(Java_Edition)
[triggers]: https://minecraft.wiki/w/Advancement/JSON_format#List_of_triggers

