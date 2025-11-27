访问转换器（Access Transformers）
===================

访问转换器（简称 AT）允许放宽类、方法和字段的可见性并修改其 `final` 标志。它们使模组作者能够访问并修改那些在其控制范围之外、本应无法访问的类成员。

可以在 Minecraft Forge 的 GitHub 上查看规范文档（[specs]）。

添加访问转换器
----------

在模组项目中添加 Access Transformer 很简单，只需在你的 `build.gradle` 中加入一行：

```groovy
// 这个块同时也是你指定 mappings 版本的地方
minecraft {
  accessTransformer = file('src/main/resources/META-INF/accesstransformer.cfg')
}
```

在添加或修改访问转换器后，需要刷新 Gradle 项目以使转换生效。

在开发过程中，AT 文件可以放在上面行指定的任意位置。但是，在非开发环境下加载时，Forge 只会在你的 JAR 中搜索精确路径 `META-INF/accesstransformer.cfg`。

注释
--------

在行内，`#` 后面的所有文本直到行尾都会被视为注释并不会被解析。

访问修饰符
----------------

访问修饰符指定给定目标将被转换成何种新的成员可见性。按可见性从高到低：

* `public` - 在包内和包外对所有类可见
* `protected` - 仅对包内类和子类可见
* `default` - 仅对包内类可见
* `private` - 仅在类内部可见

可以在上述修饰符后附加一个特殊的 `+f` 或 `-f`，分别表示添加或移除 `final` 修饰符；`final` 会阻止子类化、方法重写或字段修改。

!!! warning
    指令只会修改它们直接引用的方法；任何覆盖该方法的方法不会被访问转换。建议确保被转换的方法没有未转换的覆盖方法，否则 JVM 可能会抛出错误。
    
    可以安全转换的方法示例包括 `private` 方法、`final` 方法（或属于 `final` 类的方法）以及 `static` 方法。

目标与指令
----------------------

!!! important
    在对 Minecraft 类使用访问转换器时，字段和方法必须使用 SRG 名称。

### 类
要指定类作为目标：
```
<access modifier> <fully qualified class name>
```
内部类通过将外部类的完全限定名与内部类名用 `$` 连接来表示。

### 字段
要指定字段作为目标：
```
<access modifier> <fully qualified class name> <field name>
```

### 方法
指定方法需要特殊语法以标明方法参数和返回类型：
```
<access modifier> <fully qualified class name> <method name>(<parameter types>)<return type>
```

#### 指定类型

也称为“描述符”：有关更技术细节，请参阅 [Java 虚拟机规范，SE 8，第 4.3.2 与 4.3.3 节][jvmdescriptors]。

* `B` - `byte`，有符号字节
* `C` - `char`，UTF-16 的 Unicode 字符代码点
* `D` - `double`，双精度浮点
* `F` - `float`，单精度浮点
* `I` - `integer`，32 位整数
* `J` - `long`，64 位整数
* `S` - `short`，有符号短整型
* `Z` - `boolean`，`true` 或 `false`
* `[` - 表示数组的一个维度
  * 示例：`[[S` 表示 `short[][]`
* `L<class name>;` - 表示引用类型
  * 示例：`Ljava/lang/String;` 表示 `java.lang.String` 引用类型（注意使用斜杠而非点）
* `(` - 表示方法描述符，参数应写在括号中；如果没有参数则为空
 * 示例：`<method>(I)Z` 表示接受一个整数参数并返回布尔值的方法
* `V` - 表示方法无返回值，只能出现在方法描述符末尾
  * 示例：`<method>()V` 表示无参数且无返回值的方法

示例
--------

```
# 将 Crypt 中的 ByteArrayToKeyFunction 接口设为 public
public net.minecraft.util.Crypt$ByteArrayToKeyFunction

# 将 MinecraftServer 中的 'random' 字段设为 protected 并移除 final 修饰符
protected-f net.minecraft.server.MinecraftServer f_129758_ #random

# 将 Util 中的 'makeExecutor' 方法设为 public，接受一个 String 并返回一个 ExecutorService
public net.minecraft.Util m_137477_(Ljava/lang/String;)Ljava/util/concurrent/ExecutorService; #makeExecutor

# 将 UUIDUtil 中的 'leastMostToIntArray' 方法设为 public，接受两个 long 并返回 int[]
public net.minecraft.core.UUIDUtil m_235872_(JJ)[I #leastMostToIntArray
```

[specs]: https://github.com/MinecraftForge/AccessTransformers/blob/master/FMLAT.md
[jvmdescriptors]: https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html#jvms-4.3.2

