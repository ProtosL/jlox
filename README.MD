# jlox
[Crafting Interpreters](https://www.craftinginterpreters.com)

## Install
```sh
yarn global add jlox
```

or

```sh
npm install -g jlox
```

## Usage
```sh
jlox --path=<FILE.EXT>
```


## Syntax

### Variables
```
var a = 123;
var b;
b = 223;
var c = "hello world";
```

### Print
```
print "hello world";
print 3 * 4;
```

### Comment
```
var name = "John"; // username
print name;
```

### Operators
```
(5 + 6) * 10 - 12 / 3;
```

### Expressions
```
var a = 5;
print a * 5;
print "John" + " " + "Doe";
// 25
// John Doe
```

### Conditional Execution
```
var a = 3;
if (a < 4)
    print 111;
else
    print 222;
// 111
```

### Logical Operators
```
print "hi" or 2; // "hi".
print nil or "yes"; // "yes".

var a = 3;
if (a > 2 and a == 3)
    print("if statement");
else
    print("else statement");
// if statement
```

### For Loop
```
var a = 0;
var temp;

for (var b = 1; a < 10000; b = temp + b) {
    print a;
    temp = a;
    a = b;
}
```

### While Loop
```
var a = 1;
while (a < 10) {
    print a;
    a = a + 1;
}
```

### Function
```
fun sayHi(first, last) {
  return "Hi, " + first + " " + last + "!";
}

print sayHi("Dear", "Reader"); // Hi, Dear Reader!
```

### Class
```
class Breakfast {
    cook(something) {
        print "cook " + something + ".";
    }
}

Breakfast().cook("egg");
```

### Inherit
```

class Doughnut {
  cook() {
    print "Fry until golden brown.";
  }
}

class BostonCream < Doughnut {
  cook() {
    super.cook();
    print "Pipe full of custard and coat with chocolate.";
  }
}

BostonCream().cook();
```