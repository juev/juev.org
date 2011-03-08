--- 
layout: post
title: !binary |
  0J7QsdC90L7QstC70LXQvdC40LUgTGludXgg0Y/QtNGA0LA6IDIuNi4yOC44
  INC4IDIuNi4yNy4yMC4g0KPRgdGC0YDQsNC90LXQvdCwINGD0Y/Qt9Cy0LjQ
  vNC+0YHRgtGM

---
Выпущены очередные обновления Linux ядра - 2.6.28.8 и 2.6.27.20, в которых устранено более 100 ошибок. Изменения затронули подсистемы: drm/i915, crypto, ACPI, ext4, jbd2, V4L, xen, selinux, libata, inotify, ALSA, md/raid10, USB, SCSI, JFFS2.

Кроме того в сетевой подсистеме ядра устранена уязвимость, дающая возможность локальному злоумышленнику получить доступ к закрытым областям памяти ядра через некорректное использование опции SO_BSDCOMPAT при создании сокета. Первоначально уязвимость была молча устранена еще в ядре 2.6.28.6, но исправление оказалось неполным. В 2.6.28.6 также была исправлена уязвимость в skfp_ioctl(), позволяющая локальному пользователю сбросить счетчики статистики драйвера skfddi.

<a href="http://www.opennet.ru/opennews/art.shtml?num=20780" target="_blank">Источник</a>
