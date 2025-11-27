# 数据包（Datapack）注册表对象生成

可以通过构造一个 `DatapackBuiltinEntriesProvider` 并传入包含要注册对象的 `RegistrySetBuilder` 来为模组生成 datapack 注册表对象。该提供者需通过 `DataGenerator#addProvider` 添加到生成器中。

!!! note
    `DatapackBuiltinEntriesProvider` 是对 `RegistriesDatapackGenerator` 的 Forge 扩展，能在引用已有 datapack 注册表对象时正确处理而不出错。因此本节使用 `DatapackBuiltinEntriesProvider`。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成服务器数据时运行
        event.includeServer(),
        output -> new DatapackBuiltinEntriesProvider(
          output,
          event.getLookupProvider(),
          // 包含要生成的 datapack 注册表对象的构建器
          new RegistrySetBuilder().add(/* ... */),
          // 需要为其生成对象的模组 id 集合
          Set.of(MOD_ID)
        )
    );
}
```

`RegistrySetBuilder`
--------------------

`RegistrySetBuilder` 用于构建要包含在 datapack 中的注册表对象。可以通过 `#add` 为指定的注册表注册一组对象，`#add` 接受注册表的 `ResourceKey`、一个 `RegistryBootstrap`（包含用于注册对象的 `BootstrapContext` 的 consumer），以及可选的 `Lifecycle` 来指示该注册表对象的生命周期状态。

```java
new RegistrySetBuilder()
  // 创建配置要素（configured features）
  .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
    // 在此注册配置要素
  })
  // 创建已放置要素（placed features）
  .add(Registries.PLACED_FEATURE, bootstrap -> {
    // 在此注册已放置要素
  });
```

注册时使用 `BootstrapContext#register`
-------------------------------------

在 `BootstrapContext` 中使用 `#register` 可登记对象，`#register` 接受该对象的 `ResourceKey`、要注册的对象，以及可选的 `Lifecycle`。

```java
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
  Registries.CONFIGURED_FEATURE,
  ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
);

new RegistrySetBuilder()
  .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
    bootstrap.register(
      EXAMPLE_CONFIGURED_FEATURE,
      new ConfiguredFeature<>(
        Feature.ORE,
        new OreConfiguration(List.of(), 8)
      )
    );
  })
  .add(Registries.PLACED_FEATURE, bootstrap -> {
    // 注册 placed feature
  });
```

### Datapack 注册表对象查找

在某些情况下，datapack 注册表对象需要引用其他 datapack 注册表对象或包含注册表对象的标签（tag）。这时可通过 `BootstrapContext#lookup` 获取另一个注册表的 `HolderGetter`，然后通过 `getOrThrow` 按键获取 `Holder$Reference` 或 `HolderSet$Named`（用于标签）。

```java
// 在构造 placed feature 时查找已注册的 configured feature
HolderGetter<ConfiguredFeature<?, ?>> configured = bootstrap.lookup(Registries.CONFIGURED_FEATURE);

bootstrap.register(
  EXAMPLE_PLACED_FEATURE,
  new PlacedFeature(
    configured.getOrThrow(EXAMPLE_CONFIGURED_FEATURE),
    List.of()
  )
);
```

[datagen]: ../datagen.md#data-providers
