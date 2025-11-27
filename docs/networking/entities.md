# 实体（Entities）

除了常规的网络消息外，Forge 提供了用于同步实体数据的若干系统。

生成（Spawn）数据
-----------------

模组实体的生成通常由 Forge 单独处理。

!!! note
    这意味着仅继承原版实体类不一定能获得其全部行为，可能需要自行实现某些原版行为。

若实体在客户端需要某些静态（不会随时间变化）数据，可将其加入 Forge 发送的生成数据包：

### IEntityAdditionalSpawnData

实现该接口可在生成包中编码/解码额外数据。通过 `#writeSpawnData` 和 `#readSpawnData` 控制如何将数据写入或从网络缓冲区读取。

动态数据
--------

### 数据参数（Data Parameters）

这是原版用于将实体数据从服务端同步到客户端的主要机制，有许多原版示例可供参考。

首先，需要为要同步的数据创建一个 `EntityDataAccessor<T>`，该字段应在实体类中以 `static final` 形式声明，通过 `SynchedEntityData#defineId` 获取，并传入实体类与该数据类型对应的序列化器（serializer）。可用的序列化器实现作为静态常量定义在 `EntityDataSerializers` 类中。

!!! warning
    仅应为你自己实现的实体在其类内创建数据参数。向不受你控制的实体添加参数会导致用于网络发送的 ID 不同步，从而产生难以调试的崩溃。

然后，重写 `Entity#defineSynchedData` 并在其中通过 `this.entityData.define(...)` 为每个数据参数定义初始值。记得先调用 `super` 方法！

可以通过实体的 `entityData` 实例获取与设置这些值，变更会自动同步到客户端。
