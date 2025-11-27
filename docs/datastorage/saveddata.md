# Saved Data

Saved Data（保存数据，简称 SD）系统是相对于等级（level）能力的一种替代方案，可用于在每个世界（level）上附加数据。

声明
----

每个 SD 实现必须继承 `SavedData` 类。有两个重要方法需要注意：

* `save`：允许实现将 NBT 数据写入等级。
* `setDirty`：在修改数据后必须调用此方法，以通知游戏有需要写入的更改。如果不调用，`#save` 将不会被调用，现有数据将保持不变。

附加到等级
-------------

任何 `SavedData` 都会动态加载并附加到某个等级。因此，如果在某个等级上从未创建该 SD，则该 SD 在该等级上不会存在。

`SavedData` 由 `DimensionDataStorage` 创建或加载，后者可通过 `ServerChunkCache#getDataStorage` 或 `ServerLevel#getDataStorage` 访问。从那里可以通过调用 `DimensionDataStorage#computeIfAbsent` 获取或创建你的 SD 实例。该方法会尝试获取当前存在的 SD 实例，若不存在则创建新实例并加载所有可用数据。

`DimensionDataStorage#computeIfAbsent` 接受三个参数：一个将 NBT 数据加载到 SD 并返回该 SD 的函数；一个用于构造 SD 新实例的 supplier；以及存放在该等级 `data` 文件夹下 `.dat` 文件的名称。

例如，若在下界（Nether）中将 SD 命名为 "example"，则会在 `./<level_folder>/DIM-1/data/example.dat` 创建一个文件，并可按如下方式实现：

```java
// 在某个类中
public ExampleSavedData create() {
  return new ExampleSavedData();
}

public ExampleSavedData load(CompoundTag tag) {
  ExampleSavedData data = this.create();
  // 加载保存的数据
  return data;
}

// 在该类的某个方法中
netherDataStorage.computeIfAbsent(this::load, this::create, "example");
```

若需在多个等级间持久保存 SD，应将 SD 附加到主世界（Overworld），可通过 `MinecraftServer#overworld` 获取。主世界是唯一永不完全卸载的维度，因此适合用于存放多等级共享的数据。
