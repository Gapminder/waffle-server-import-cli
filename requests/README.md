# Data structure for Incremental Update via Cli-tool

## 1. Base Protocol Structure
```
{
    'files': {},
    'changes': {}
};
```

### 1.1 Structure of section : `files`
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

`'D'` - Deleted.

### 1.2 Structure of section : `changes`
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

## 2. Structure of section : `changes / header`

### 2.1 Structure of section : `create`
```
[
    ...
    "column name",
    ...
]
```

### 2.2 Structure of section : `remove`
```
[
    ...
    "column name",
    ...
]
```

### 2.3 Structure of section : `update`
```
[
    ...
    {
        "old column value": "new column value"
    },
    ...
]
```

## 3. Structure of section : `changes / body`
### 3.1 Structure of section : `create`
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

### 3.2 Structure of section : `remove` (**General**-case)
```
[
    ...
    {
        "GID": "uniq value"
    },
    ...
]
```

### 3.3 Structure of section : `remove` (**DataPoint**-case)
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


### 3.4 Structure of section : `update`  (**General**-case)
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

### 3.5 Structure of section : `update`  (**DataPoint**-case)
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

### 3.6 Structure of section : `change` (**General**-case)
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

### 3.7 Structure of section : `update`  (**DataPoint**-case)
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

## 4. Use cases
### 4.1 Concept File
### 4.1.1 Added `*`
- Insert New Documents (from: current version, to: oo), as Default Import Algorithm;

### 4.1.2 Removed `*`
- Update All Documents (to: current version);

### 4.1.3 Modified
#### 4.1.3.1 header
##### 4.1.3.1.1 header / create
- Update All Documents with pair ({"new property":""});
*operation could be skipped, since all changes already collected in body section for each row*

##### 4.1.3.1.2 header / remove
- Remove from All Documents pair ({"removed property":"any value"});

##### 4.1.3.1.3 header / update
- Update All Documents replacing pair ({"updated property":"old value"} by "modified property");

#### 4.1.3.2 body
##### 4.1.3.2.1 body / create
- Insert New Document (from: current version, to: oo);

##### 4.1.3.2.2 body / remove
- Update Document' (to: current version);
- Resolve DrillUp, DrillDown relations;
- Resolve DataPoint relations (update related Datapoints with (to: current version);
-- Update related Datapoints (to: current version);
-- Create copies of updated DataPoints (from: current version);
- Resolve type: measure;
-- Update related Datapoints (to: current version);
-- Create copies of updated DataPoints (from: current version);
- Resolve type: time/domain;
-- Resolve dependencies domain/ES/Entities/DataPoints;

##### 4.1.3.2.3 body / update
- Update Old Document' (to: current version);
- Insert Document'' based on Document', data enlarged with pairs from `data-update` array (from: current version, to: oo);

##### 4.1.3.2.3 body / change
- Update Old Document' (to: current version)
- Insert New Document'' replacing data with `data-update` structure (from: current version, to: oo)



### 4.2 Entity File
ToDo

### 4.3 DataPoint File
ToDo