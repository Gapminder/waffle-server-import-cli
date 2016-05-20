# Data structure for Incremental Update via Cli-tool

## Base Protocol Structure
```
{
    'files': {},
    'changes': {}
};
```

## Structure of section : `files`
```
{
    ...
    'file_name_1.csv': 'M',
    'file_name_1.csv': 'A',
    'file_name_1.csv': 'D',
    ...
}
```
**File Modificator Types:**

`'M'` - Modified;

`'A'` - Added;

`'D'` - Deleted

## Structure of section : `changes`
```
{
    ...
    'file_name_1.csv' : {
        "header": {
            "create": [],
            "remove": [],
            "update": []
        },
        "body": {
            "create": [],
            "remove": [],
            "update": [],
            "change": []
        }
    },
    ...
}
```
**Main difference between update/change**

`'update'` - used, when just a new value was added into some cell;

`'change'` - used, when row should be totally overwritten;

## Structure of section : `changes / header`

### Structure of section : `create`
```
[
    ...
    "column name",
    ...
]
```

### Structure of section : `remove`
```
[
    ...
    "column name",
    ...
]
```

### Structure of section : `update`
```
[
    ...
    {
        "old column value": "new column value"
    },
    ...
]
```

## Structure of section : `changes / body`
### Structure of section : `create`
```
[
    ...
    {
        "column 1": "value 1",
        ...
        "column n": "value n"
    },
    ...
]
```

## Structure of section : `remove` (**General**-case)
```
[
    ...
    {
        "GID": "uniq value"
    },
    ...
]
```

## Structure of section : `remove` (**DataPoint**-case)
```
[
    ...
    {
        "column 1": "value 1",
        ...
        "column n": "value n"
    },
    ...
]
```


## Structure of section : `update`  (**General**-case)
```
[
    ...
    {
        "gid": "GID-KEY",
        "GID-KEY": "VALUE",
        "data-update": {
            "new column 1": "new value 1",
            ...
            "new column n": "new value n"
        }
    }
    ...
]
```

`GID-KEY` - enough to define uniq item

`data-update` - contain only pairs that would be added

## Structure of section : `update`  (**DataPoint**-case)
```
[
    ...
    {
        "gid": "GID-KEY",
        "GID-KEY": "VALUE",
        "data-update": {
            "new column 1": "new value 1",
            ...
            "new column n": "new value n"
        },
        "data-origin": {
            "new column 1": "new value 1",
            ...
            "new column n": "new value n"
        },
    }
    ...
]
```

`data-origin` - used to define uniq item

`data-update` - contain only pairs that would be updated

## Structure of section : `change` (**General**-case)
```
[
    ...
    {
        "gid": "GID-KEY",
        "GID-KEY": "VALUE",
        "data-update": {
            "new column 1": "new value 1",
            ...
            "new column n": "new value n"
        }
    }
    ...
]
```

`GID-KEY` - enough to define uniq item

`data-update` - contain only pairs that would be updated

## Structure of section : `update`  (**DataPoint**-case)
```
[
    ...
    {
        "gid": "GID-KEY",
        "GID-KEY": "VALUE",
        "data-update": {
            "new column 1": "new value 1",
            ...
            "new column n": "new value n"
        },
        "data-origin": {
            "new column 1": "new value 1",
            ...
            "new column n": "new value n"
        },
    }
    ...
]
```

`data-origin` - used to define uniq item

`data-update` - contain only pairs that would be updated