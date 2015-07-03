---
layout: post
title: 'awesome: настройка и использование'
keywords: awesome,wm,config
date: 2009-05-18 00:00
tags:
- awesome
- wm
---
Итак, в прошлой статье <a rel="bookmark" href="/2009/05/18/awesome-ustanovka-i-zapusk/">awesome: установка и запуск</a> мы рассмотрели, как установить awesome и обеспечить его запуск при загрузке системы. Теперь рассмотрим самое интересное -- его конфигурацию. Для этого начинаем менять файл `~/.config/awesome/rc.lua`, который скопировали в предыдущей статье.

Полный вариант моего конфигурационного файла: <a href="https://gist.github.com/1014780" rel="nofollow">gist.github.com/1014780</a>.

Для начала комментируем стандартную тему, устанавливая двойное тире -- в начале нужной строки и прописываем свою:

    theme_path = "/home/juev/.config/awesome/themes/sky"

Не забудьте указать свой домашний каталог!

Затем коментируем почти все layout:

    layouts =
    {
    awful.layout.suit.tile,
    --    awful.layout.suit.tile.left,
    awful.layout.suit.tile.bottom,
    --    awful.layout.suit.tile.top,
    --    awful.layout.suit.fair,
    --    awful.layout.suit.fair.horizontal,
    --    awful.layout.suit.max,
    --    awful.layout.suit.max.fullscreen,
    --    awful.layout.suit.magnifier,
    --    awful.layout.suit.floating
    }

Здесь они комментируются для того, чтобы не использовать их при переборе вариантов расположения нажатием Ctrl+Space, но они могут в дальнейшем использоваться в других клавиатурных комбинациях. Оставили только два варианта -- это tile и tile.bottom. Использовать авесоме и не использовать тилинговое расположение по умолчанию, не наш путь! :)

Кстати, layout описанный в данном списке первым используется по умолчанию.

Теперь описываем основные правила для отдельных приложений:

    floatapps =
    {
    ["MPlayer"] = true,
    --    ["Thunar"] = true,
    ["gcalctool"] = true,
    --    ["Pidgin"] = true,
    --    ["pinentry"] = true,
    ["gimp-2.6"] = true,
    -- by instance
    --    ["mocp"] = true,
    -- Mozilla
    ["Dialog"] = true,
    }

Как видно, часть приложений у меня закоментировано, так как в результате эксперимента выявил, что эти приложения лучше всего использовать в тилинговом режиме. В плавающем режиме оказываются mplayer, калькулятор, gimp и диалоговые окна.

Затем описываем основные правила расположения окон по рабочим столам:

    apptags =
    {
    ["Firefox"] = { screen = 1, tag = 2 },
    ["Conkeror"] = { screen = 1, tag = 2 },
    ["Emacs"] = { screen = 1, tag = 3 },
    ["Pidgin"] = { screen = 1, tag = 4 },
    }

Параметр screen отвечает за монитор, у меня он один, поэтому везде используется значение 1, а параметр tag отвечает за рабочий стол, на котором будет запскаться конкретная программа. Итак -- огнелис и conkeror запускаются на втором рабочем столе, емакс на третьем, а pidgin на четвертом. Все остальные окна будут открываться на текущем рабочем столе.

Затем меняем описание создания рабочих столов, с указанием используемого на нем layout:

{% raw %}

    -- {{{ Tags
    -- Define tags table.
    tags = {}
    for s = 1, screen.count() do
    -- Each screen has its own tag table.
    tags[s] = {}
    -- Create 9 tags per screen.
    tags[s][1] = tag(1)
    tags[s][1].screen = s
    awful.layout.set(awful.layout.suit.tile.bottom, tags[s][1])
    tags[s][2] = tag(2)
    tags[s][2].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][2])
    tags[s][3] = tag(3)
    tags[s][3].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][3])
    tags[s][4] = tag(4)
    tags[s][4].screen = s
    awful.layout.set(awful.layout.suit.tile, tags[s][4])
    tags[s][5] = tag(5)
    tags[s][5].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][5])
    tags[s][6] = tag(6)
    tags[s][6].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][6])
    tags[s][7] = tag(7)
    tags[s][7].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][7])
    tags[s][8] = tag(8)
    tags[s][8].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][8])
    tags[s][9] = tag(9)
    tags[s][9].screen = s
    awful.layout.set(awful.layout.suit.max, tags[s][9])
    -- I'm sure you want to see at least one tag.
    tags[s][1].selected = true
    end
    -- }}}

{% endraw %}

Как видно из кода, создаются теже 9 рабочих столов, имена которых соответствуют их порядковым номерам. На первом рабочем столе используется layout tile.bottom, на четвертом используется обычный tile, а на остальных max. Чем отличаются различные layout я описывать не буду, лучше посмотрите на практике.

Затем я изменил немного wibox, то есть расположение элементов на стандартной панели:

    -- Create the wibox
    mywibox[s] = wibox({ position = "top", fg = beautiful.fg_normal, bg = beautiful.bg_normal })
    -- Add widgets to the wibox - order matters
    mywibox[s].widgets = { mylauncher,
    --                           mylayoutbox[s],
    mytaglist[s],
    mytasklist[s],
    mypromptbox[s],
    --                           mpdwidget,
    s == 1 and mysystray or nil,
    mytextbox, }
    mywibox[s].screen = s

Здесь важен именно порядок указания определенных элементов.

Затем начинаем менять и описывать свои клавиатурные комбинации:

    -- Prompt
    key({ modkey }, "F1",
    function ()
    awful.prompt.run({ prompt = "Run: " },
    mypromptbox[mouse.screen],
    awful.util.spawn, awful.completion.bash,
    awful.util.getdir("cache") .. "/history")
    end),

    key({ modkey }, "F4",
    function ()
    awful.prompt.run({ prompt = "Run Lua code: " },
    mypromptbox[mouse.screen],
    awful.util.eval, awful.prompt.bash,
    awful.util.getdir("cache") .. "/history_eval")
    end),

    -- My keys
    key( { "Mod1" }, "F2", function() awful.util.spawn( 'dmenu_run' ) end),
    key( { modkey }, "F2", function() awful.util.spawn( 'dmenu_run' ) end),
    key( {}, "F15", function() awful.util.spawn( 'gcalctool' ) end),
    key( {}, "F14", function() awful.util.spawn( 'scrot -q 10' ) end),
    key( { "Mod1" }, "F14", function() awful.util.spawn( 'scrot -q 10 -s' ) end),
    key( {}, "F16", function() awful.util.spawn( 'firefox' ) end),
    key( { "Mod1" }, "F16", function() awful.util.spawn( 'conkeror' ) end),
    key( {}, "F17", function() awful.util.spawn( 'emacs' ) end),
    key( {}, "F18", function() awful.util.spawn( 'thunar' ) end),
    key( {}, "F19", function() awful.util.spawn( 'pidgin' ) end),
    key( { "Mod1" }, "F19", function() awful.util.spawn( 'keepassx' ) end),
    key( { modkey }, "F10", function() awful.util.spawn( '/home/juev/.scripts/off' ) end),

    key({ modkey }, "Tab",  awful.tag.history.restore),
    key({ "Mod1" }, "Tab", function () awful.client.focus.byidx(1); if client.focus then client.focus:raise() end end),
    key({ "Mod1", "Shift" }, "Tab", function () awful.client.focus.byidx(-1);  if client.focus then client.focus:raise() end end),

    --My Layout keys
    key({ modkey }, "r", function() awful.layout.set(awful.layout.suit.tile) end),
    key({ modkey }, "w", function() awful.layout.set(awful.layout.suit.tile.bottom) end),
    key({ modkey }, "d", function() awful.layout.set(awful.layout.suit.magnifier) end),
    key({ modkey }, "f", function() awful.layout.set(awful.layout.suit.floating) end),
    key({ modkey }, "m", function() awful.layout.set(awful.layout.suit.max) end),

    -- Multimedia keys
    key( {}, "XF86AudioLowerVolume", function() awful.util.spawn( 'amixer -q set Master 5- unmute' ) end),
    key( {}, "XF86AudioRaiseVolume", function() awful.util.spawn( 'amixer -q set Master 5+ unmute' ) end),
    key( {}, "XF86AudioMute", function() awful.util.spawn( 'amixer -q sset Master toggle' ) end),

    key( {}, "XF86AudioPrev", function() awful.util.spawn( 'mpc prev' ) end),
    key( {}, "XF86AudioPlay", function() awful.util.spawn( 'mpc toggle' ) end),
    key( {}, "XF86AudioNext", function() awful.util.spawn( 'mpc next' ) end),

Я переопределил сочетания для запуска программ с помощью самого авесоме на Win-F1, а запуск Lua-кода на Win-F4. Затем описал свои комбинации клавиш для запуска определенных программ и изменения layout. Более подробно по используемым командам я опишу в отдельной статье. А сейчас более подробно остановлюсь на комбинациях для установки layout. В моем случае комбинация Win-r переключает на tile, Win-w на tile.bottom, Win-d на magnifier, Win-f на float, Win-m на max. Таким образом одним нажатием клавиш тут же меняем раположение окон на экране. Это просто великолепно и очень удобно!

Затем идет описание клавиатурных сочетаний для активного окна:

    -- Client awful tagging: this is useful to tag some clients and then do stuff like move to tag on them
    clientkeys =
    {
    key({ modkey            }, "q",      function (c) c:kill()                         end),
    key({ modkey,           }, "f",      function (c) c.fullscreen = not c.fullscreen  end),
    key({ modkey, "Shift"   }, "c",      function (c) c:kill()                         end),
    key({ modkey, "Control" }, "space",  awful.client.floating.toggle                     ),
    key({ modkey, "Control" }, "Return", function (c) c:swap(awful.client.getmaster()) end),
    key({ modkey,           }, "o",      awful.client.movetoscreen                        ),
    key({ modkey, "Shift"   }, "r",      function (c) c:redraw()                       end),
    key({ modkey }, "t", awful.client.togglemarked),
    key({ modkey, "Shift"   }, "m",
    function (c)
    c.maximized_horizontal = not c.maximized_horizontal
    c.maximized_vertical   = not c.maximized_vertical
    end),
    }

Здесь сочетания Win-q и Win-Shift-c убивают активные окна, Win-f переключает в полноэкранный режим (пока не работает, так как сочетание уже используется в глобальных комбинациях). Win-Ctrl-Space переключает активное окно во флоат-режим, Win-Ctrl-Return переносит активное окно в самую большую область, Win-Shift-r перерисовывает активное окно.

Я не люблю, когда фокус следует за мышью, поэтому закоментировал строки:

    -- Hook function to execute when the mouse enters a client.
    awful.hooks.mouse_enter.register(function (c)
    -- Sloppy focus, but disabled for magnifier layout
    --    if awful.layout.get(c.screen) ~= awful.layout.suit.magnifier
    --        and awful.client.focus.filter(c) then
    --        client.focus = c
    --    end
    end)

Если вам нравиться обратное, то лучше их не трогать.

Для того, чтобы между окнами в тайловом режиме не было свободных промежутков, убираем коментарий со строки:

    -- Honor size hints: if you want to drop the gaps between
    c.size_hints_honor = false

Для того, чтобы использовать вывод консольных программ в авесоме прописываем дополнительную функцию:

    -- Запускаем команду и возвращаем ее вывод. Вы можете запускать команды со множеством выходящих строк
    function execute_command(command)
    local fh = io.popen(command)
    local str = ""
    for i in fh:lines() do
    str = str .. i
    end
    io.close(fh)
    return str
    end

И напоследок описываем функцию, которая периодически вызывается и вывод ее затем используется в панели авесоме:

    -- Hook called every minute
    awful.hooks.timer.register(1, function ()
    --    mytextbox.text = os.date(" %a %b %d, %H:%M ")
    mytextbox.text = execute_command("sensors| grep temp3| awk '{print ($2)}'") .. " | " .. os.date("%a, %d %B %H:%M") .. " "
    end)

По умолчанию производиться только вывод текущего времени, причем с незаданным форматом вывода. Я использую вызов системной команды sensors для определения температуры процессора и преоразую время в нужный мне формат.

Собственно все. Естественно я описывал только те возможности, что использую сам. Но, надеюсь, что хотя бы эта небольшая толика поможет вам разобраться с этим великолепным оконным менеджером. Стоит его только раз настроить и затем можно очень долгое время использовать туже конфигурацию. Пока разработчики не внесут опять какие-нибудь изменения в формат конфигурационного файла. Будем надеятся, что это будет происходить как можно реже...
