---
layout: post
title: "Cue: валидация конфигурации"
date: 2021-07-04T19:05:00+0300
image: https://static.juev.org/2021/07/cue.svg
tags:
  - yaml
  - cue
  - tips
---
Как devops мне много приходиться работать с yaml-файлами для описания
конфигурации различных приложений. И до сих пор валидация конфигурации
заключалась в ее беглом просмотре глазами и попытке использовать в програмах.
Было бы неплохо иметь возможность валидации yaml/json-конфигурации.

В очередной раз обратил внимание на [cuelang](https://cuelang.org/) и его
возможность
[валидации](https://cuelang.org/docs/tutorials/tour/intro/validation/)
json/yaml-конфигурации с помощью описания
[схем](https://cuelang.org/docs/usecases/datadef/). Решил попробовать описать
схему для prometheus-алертов.

Достаточно быстро набросал следующую схему (файл `rules.cue`):

```json
#rule: {
	alert: string
	expr: string
	for?: string
	labels: {
		severity: =~"info|warning|high|disaster"
		service?: string
	}
	annotations?: {
		summary: string
	}
}

groups: [{
	name: string
	rules: [...#rule]
}]
```

Использовать схему можно простым запуском:

```bash
cue vet -c -E -s alerts.yaml rules.cue
```

Проверял путем явного создания ошибок, например дублировал символы, вместо
`summary` прописывал `summarry`, в результате чего получал следующую ошибку:

```bash
groups.0.rules.15.annotations: field not allowed: summarry:
    ./prod/all/rules-all.cue:14:16
    ./prod/all/rules-all.cue:21:13
    ./prod/all/rules-all.yml:150:87
```

Схемы описываются довольно просто, что позволяет использовать валидацию и в
ci/cd процессах.
