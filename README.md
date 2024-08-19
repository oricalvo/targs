<h1 align="center">Targs</h1>
<p align="center">
  <b >A CLI parameters parser with emphasis on type safety</b>
</p>

## Description
Targs helps you build command line tools.
As opposed to other CLI parsers, Targs returns type safe parameter and therefore allow for
better compilation and intellisense support
Targs is not a framework for managing the whole CLI application lifecycle
Instead it focuses on parsing argv in a type safe manner

## Installation

Stable version:
```bash
npm install targs-node
```

## Simple Example

```typescript
import {readCliArgs} from "targs";

const {name} = readCliArgs({
    name: CliArgString(),
});

console.log("Hello " + name + "!");
```

```bash
$ ./main.js --name=Ori
Hello Ori!
```

## Complex Example

```javascript
import {readCliArgs} from "targs";

const cli = readCliArgs({
    ids: CliArgArrayNumber("ids"), // Parameter --ids is required, must be of the format 1,2,3
    verbose: CliArgBoolean("v", true), // Parameter -v is optional (default value is true)
});

console.log("Ids: ", cli.ids);
console.log("Verbose: " + cli.verbose);
```

```bash
$ ./main.js --ids=1,2,3
Ids: 1,2,3
Verbose: true
```
