/*код игры*/

/*функция возвращает RGB-код случайного цвета*/
function get_random_color() {
    let color = '#';
    for (let i = 0; i < 3; i++) {
        let c = Math.round(get_random_number(0, 255));
        let c_hex = Number(c).toString(16);
        color += c_hex;
    }
    return color;
}

/** функция возвращает случайное число в заданном диапазоне */
function get_random_number(min, max) {
    return Math.random() * (max - min) + min;
}

/* функция запускает игру*/
let start_game = () => {
    let field = document.getElementById('game_field');
    field.innerText = '';
    game.stop();
    game.run();
}

/*функция останавливает игру*/
let stop_game = () => {
    game.stop();
}

/*класс, реализующий игру*/
class Game {
    constructor() {
        this.timer = document.getElementById('timer');
        this.score_field = document.getElementById('score');
        this.losses_field = document.getElementById('losses');
        this.field = document.getElementById('game_field');
        this.DT = 50;
    }

/*метод создает шарики*/
    create_ball() {
        let dt = get_random_number(10 + this.time, 100 + this.time * this.time);
        clearTimeout(this.timer_ball_creation_id);
        this.timer_ball_creation_id = setTimeout(this.create_ball.bind(this), dt);
        this.total_balls_number++;
        let height = this.field.clientHeight;
        let width = this.field.clientWidth;
        let ball = new Ball(width, height, this.total_balls_number);
        this.field.appendChild(ball.ball);
        this.balls.push(ball);
    }

/*метод создает ветер*/
    create_wind() {
        let dt = get_random_number(1000, 10000);
        clearTimeout(this.timer_wind_creation_id);
        this.timer_wind_creation_id = setTimeout(this.create_wind.bind(this), dt);
        this.wind.create();
    }

/*метод отвечает за движение шариков*/
    move() {
        for (let i = 0; i < this.balls.length; i++) {
            let [a, v] = this.wind.get();
            this.balls[i].influence(a, v);
            let is_inside = this.balls[i].move(this.DT / 1000);
            let is_intersection = false;
            if (is_inside && this.needle) {
                let [x_left, x_right, y] = this.needle.get_xy();
                is_intersection = this.balls[i].check_intersection(x_left, x_right, y);
                if (is_intersection) {
                    this.score += 1;
                    this.score_field.innerHTML = this.score;
                }
            }
            if (!is_inside || is_intersection) {
                let ball = this.balls.splice(i, 1)[0];
                document.getElementById(ball.ball.id).remove();
                this.losses += 1;
                this.losses_field.innerHTML = this.losses;
            }
        }
        this.wind.set_to_zero();
        if (this.balls.length == 0 && this.time <= 0) {
            clearInterval(this.timer_motion_id);
            this.field.innerHTML =
                `<h2>Кол-во лопнутых шаров ${this.score}</h2>` +
                `<h2>Кол-во пропущенных шаров ${this.losses}</h2>`;
        }
    }

/*метод запускает игру*/
    run() {
        this.time = 60;
        this.timer_id = setInterval(this.run_time.bind(this), 1000);
        let height = this.field.clientHeight;
        let width = this.field.clientWidth;
        this.needle = new Needle(width, height);
        this.field.appendChild(this.needle.needle);
        this.wind = new Wind();
        this.timer_wind_creation_id = setTimeout(this.create_wind.bind(this), 100);
        this.timer_ball_creation_id = setTimeout(this.create_ball.bind(this), 100);
        this.score = 0;
        this.score_field.innerHTML = this.score;
        this.losses = 0;
        this.losses_field.innerText = this.losses;
        this.balls = [];
        this.total_balls_number = 0;
        this.timer_motion_id = setInterval(this.move.bind(this), this.DT);
    }

/*метод отсчитывает время, пройденное от начала игры*/
    run_time() {
        this.time -= 1;
        this.timer.innerText = this.time;
/*если в игре прошло больше 60 сек, то останавливаем игру*/
        if (this.time <= 0) {
            clearInterval(this.timer_id);
            clearTimeout(this.timer_ball_creation_id);
            this.needle.remove();
            this.needle = null;
        }
    }

/*метод останавливает игру*/
    stop() {
        if (this.timer_id) {
            clearInterval(this.timer_id);
            clearTimeout(this.timer_ball_creation_id);
            clearTimeout(this.timer_motion_id);
        }
    }
}

/*класс для шариков*/
class Ball {
    constructor(x_max, y_max, id) {
        this.ball = document.createElement('div');
        this.ball.classList.add('ball');
        this.ball.id = id;
        this.ball.style.backgroundColor = get_random_color();
        this.r = get_random_number(0, 100);
        this.ball.style.height = `${2 * this.r}px`;
        this.ball.style.width = `${2 * this.r}px`;
        this.x_max = x_max;
        this.y_max = y_max;
        this.x = get_random_number(this.r, x_max - 2 * this.r);
        this.y = this.r;
        this.set_position(this.x, this.y);
        this.v_x = 0;
        this.v_y = get_random_number(20, 50);
    }

/*метод проверяет, находится ли шарик внутри игрового поля*/
    check_inside() {
        if (0 > this.x - this.r || this.x + this.r > this.x_max)
            return false;
        if (0 > this.y - this.r || this.y + this.r > this.y_max)
            return false;
        return true;
    }

/*метод проверяет пересечение иголки и шарика*/
    check_intersection(x_left, x_right, y) {
        if (this.y > y &&
            ((this.x - this.r <= x_left && x_left < this.x + this.r) ||
                (this.x - this.r <= x_right && x_right < this.x + this.r)))
            return true;
        else if (this.check_point_inside(x_left, y) ||
            this.check_point_inside(x_right, y))
            return true;
        return false;
    }

/*метод проверяет, находится ли точка внутри шарика*/
    check_point_inside(x, y) {
        let r = Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2);
        if (Math.pow(this.r, 2) >= r)
            return true;
        return false;
    }

/*метод учитывает влияние ветра*/
    influence(a, v) {
        if (v < 1)
            return;
        const K = 0.001;
        let x = 0;
        if (a > 90)
            x = this.x_max;
        this.v_x += Math.exp(-K * Math.abs(this.x - x)) * v * Math.cos(a * Math.PI / 180);
        this.v_y += Math.exp(-K * Math.abs(this.x - x)) * v * Math.sin(a * Math.PI / 180);
    }

/*метод перемещает шарик*/
    move(dt) {
        let x_new = this.x + this.v_x * dt;
        if (0 <= x_new - this.r && x_new + this.r < this.x_max)
            this.x = x_new;
        this.y += this.v_y * dt;
        this.set_position(this.x, this.y);
        return this.check_inside();
    }

/*метод задает положение шарика*/
    set_position(x, y) {
        this.ball.style.bottom = `${this.y - this.r}px`;
        this.ball.style.left = `${this.x - this.r}px`;
    }
}

/*класс отвечает за иголку*/
class Needle {
    constructor(x_max, y_max) {
        this.needle = document.createElement('div');
        this.needle.classList.add('needle');

        document.addEventListener('keydown', this.move.bind(this));
        this.h = 100;
        this.w = 1;
        this.needle.style.height = `${this.h}px`;
        this.needle.style.width = `${this.w}px`;
        this.x_max = x_max;
        this.y_max = y_max;
        this.x = x_max / 2;
        this.y = y_max - 2 * this.h / 3;
        this.set_position(this.x, this.y);
    }

/*метод возвращает координаты левой, правой и нижней сторон иглы*/
    get_xy() {
        return [this.x - this.w / 2, this.x + this.w / 2, this.y];
    }

/*метод управляет перемещением иглы*/
    move(e) {
        let DX = 2;
        if (e.key == 'ArrowLeft')
            this.x -= DX;
        else if (e.key == 'ArrowRight')
            this.x += DX;
        this.set_position(this.x, this.y);
    }

/*метод убирает иголку*/
    remove() {
        document.getElementsByClassName('needle')[0].remove();
    }

/*метод задает положение иголки*/
    set_position(x, y) {
        this.needle.style.bottom = `${this.y}px`;
        this.needle.style.left = `${this.x - this.w / 2}px`;
    }
}

/*класс отвечает за ветер*/
class Wind {
    constructor() {
        this.a = 0;
        this.v = 0;
    }

/*метод создает ветер в случайном направлении*/
    create() {
        this.v = get_random_number(10, 100);
        this.a = get_random_number(0, 180);
    }

/*метод получает угол и скорость ветра*/
    get() {
        return [this.a, this.v];
    }

/*метод обнуляет ветер*/
    set_to_zero() {
        this.a = 0;
        this.v = 0;
    }
}

let game = new Game();