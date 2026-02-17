import React, { useEffect, useContext } from "react";
import CONFIG, { EDIRECTION } from "../../../config";
import { ServerContext, StoreContext } from "../../../App";
import Game from "../../../game/Game";
import { Canvas, useCanvas } from "../../../services/canvas";
import { useTypingState } from "../../../hooks/useTypingState";
import useSprites from "../hooks/useSprites";
import arena from "../../../assets/img/background/arena.png"

const gameField = 'game-field';
const arenaImage = new Image();
arenaImage.src = arena;

enum EAttackMode {
    Sword = 'sword',
    Bow = 'bow'
}
type TGameCanvas = {
    onOpenItemShop: () => void;
    onCloseItemShop: () => void;
};

const GameCanvas: React.FC<TGameCanvas> = (props: TGameCanvas) => {
    const { onOpenItemShop, onCloseItemShop } = props;
    let game: Game | null = null;
    const server = useContext(ServerContext);
    const store = useContext(StoreContext);
    let canvas: Canvas;
    const Canvas = useCanvas(render);
    let attackMode = EAttackMode.Sword;
    const { WINDOW, SPRITE_SIZE } = CONFIG;

    let movementKeys = {
        w: false,
        a: false,
        s: false,
        d: false
    };

    const {
        spritesImage,
        enemySpritesImage,
        getSprite,
        animationFunctions,
        enemyAnimationFunctions,
        heroSprites,
        enemySprites
    } = useSprites();

    const heroIdleRightSprite = heroSprites.idleRightSprite;
    const heroIdleLeftSprite = heroSprites.idleLeftSprite;
    const enemyIdleRightSprite = enemySprites.idleRightSprite;
    const enemyIdleLeftSprite = enemySprites.idleLeftSprite;

    function printGameObject(
        canvas: Canvas,
        { x = 0, y = 0, width = 0, height = 0 }: { x: number; y: number; width: number; height: number },
        color: string
    ): void {
        canvas.rectangle(x, y, width, height, color);
    }

    function printFillSprite(image: HTMLImageElement, canvas: Canvas, { x = 0, y = 0 }, points: number[]): void {
        canvas.spriteFull(image, x, y, points[0], points[1], points[2]);
    }

    function printHeroSprite(
        canvas: Canvas,
        { x = 0, y = 0 },
        hero: any
    ): void {
        let spriteNumber: number;

        if (hero.isBlocking) {
            spriteNumber = hero.direction === EDIRECTION.RIGHT
                ? animationFunctions.heroBlockRight()
                : animationFunctions.heroBlockLeft();
        } else if (hero.isAttacking) {
            spriteNumber = hero.direction === EDIRECTION.RIGHT
                ? animationFunctions.heroAttackRight()
                : animationFunctions.heroAttackLeft();
        } else if (hero.isMoving) {
            spriteNumber = hero.direction === EDIRECTION.RIGHT
                ? animationFunctions.heroWalkRight()
                : animationFunctions.heroWalkLeft();
        } else {
            spriteNumber = hero.direction === EDIRECTION.RIGHT
                ? heroIdleRightSprite
                : heroIdleLeftSprite;
        }

        const [sx, sy, size] = getSprite(spriteNumber);
        printFillSprite(spritesImage, canvas, { x, y }, [sx, sy, size]);
    }

    function printEnemySprite(
        canvas: Canvas,
        { x = 0, y = 0 },
        enemy: any
    ): void {
        let spriteNumber: number;
        if (enemy.isAttacking) {
            spriteNumber = enemy.direction === EDIRECTION.RIGHT
                ? enemyAnimationFunctions.enemyAttackRight()
                : enemyAnimationFunctions.enemyAttackLeft();
        } else if (enemy.isMoving) {
            spriteNumber = enemy.direction === EDIRECTION.RIGHT
                ? enemyAnimationFunctions.enemyWalkRight()
                : enemyAnimationFunctions.enemyWalkLeft();
        } else {
            spriteNumber = enemy.direction === EDIRECTION.RIGHT
                ? enemyIdleRightSprite
                : enemyIdleLeftSprite;
        }

        const [sx, sy, size] = getSprite(spriteNumber);
        printFillSprite(enemySpritesImage, canvas, { x, y }, [sx, sy, size]);
    }

    function printHeroSword(
        canvas: Canvas,
        { x = 0, y = 0 },
        hero: any
    ): void {
        const spriteNumber = hero.direction === EDIRECTION.RIGHT
            ? animationFunctions.heroSwordRight()
            : animationFunctions.heroSwordLeft();
        const [sx, sy, size] = getSprite(spriteNumber);
        printFillSprite(spritesImage, canvas, { x, y }, [sx, sy, size]);
    }

    function render(fps: number): void {
        if (canvas && game) {
            canvas.clear();
            const scene = game.getScene();
            const { heroes, walls, arrows, enemies } = scene;
            const currentHero = game.getCurrentUserHero();
            if (currentHero) {
                canvas.clearImage(arenaImage)
                for (let i = 0; i < walls.length; i++) {
                    const wall = walls[i];
                    printGameObject(canvas, {
                        x: wall.x,
                        y: wall.y,
                        width: wall.width,
                        height: wall.height
                    }, 'transparent');
                }

                heroes.forEach((hero, index) => {
                    const color = index === 0 ? 'blue' : ['green', 'yellow', 'purple'][index % 3];
                    printGameObject(canvas, hero.rect, color);

                    canvas.text(hero.rect.x, hero.rect.y - 150, hero.name || "Неизвестно", 'white');

                    if (hero.isAttacking && attackMode === EAttackMode.Sword) {
                        const attackPosition = hero.getAttackPosition();
                        if (attackPosition) {
                            printGameObject(canvas, attackPosition, 'red');
                            printHeroSword(canvas, {
                                x: hero.rect.x - SPRITE_SIZE + hero.rect.width + 100,
                                y: hero.rect.y - SPRITE_SIZE + hero.rect.height + 10
                            }, hero);
                        }
                    }

                    printHeroSprite(canvas, {
                        x: hero.rect.x - SPRITE_SIZE + hero.rect.width + 100,
                        y: hero.rect.y - SPRITE_SIZE + hero.rect.height + 10
                    }, hero);
                });

                enemies.forEach(enemy => {
                    printGameObject(canvas, enemy.rect, 'red');
                    printEnemySprite(canvas, {
                        x: enemy.rect.x - SPRITE_SIZE + enemy.rect.width + 100,
                        y: enemy.rect.y - SPRITE_SIZE + enemy.rect.height + 10
                    }, enemy);

                    if (enemy.isAttacking) {
                        const attackPosition = enemy.getAttackPosition();
                        if (attackPosition) {
                            printGameObject(canvas, attackPosition, 'orange');
                        }
                    }
                });

                arrows.forEach(arrow => {
                    const startX = arrow.rect.x + arrow.rect.width / 2;
                    const startY = arrow.rect.y + arrow.rect.height / 2;

                    const arrowLength = 40;

                    let endX = startX;
                    let endY = startY;

                    switch (arrow.direction) {
                        case EDIRECTION.RIGHT:
                            endX = startX + arrowLength;
                            break;
                        case EDIRECTION.LEFT:
                            endX = startX - arrowLength;
                            break;
                    }
                    canvas.arrow(startX, startY, endX, endY, '#ff0000', 3);
                });

                canvas.text(WINDOW.LEFT + 20, WINDOW.TOP + 50, String(fps), 'green');
            } else {
                canvas.text(WINDOW.WIDTH / 2, WINDOW.HEIGHT / 2, 'GAME OVER', 'red');
            } canvas.render();
        }
    };

    const mouseClick = () => {
        if (attackMode === EAttackMode.Sword) {
            game?.handleSwordAttack();
        } else if (attackMode === EAttackMode.Bow) {
            game?.addArrow();
        }
    };

    const mouseRightClick = () => {
    };

    const handleMovement = () => {
        const { w, a, s, d } = movementKeys;

        let dx = 0;
        let dy = 0;

        if (a) dx -= 1;
        if (d) dx += 1;
        if (w) dy -= 1;
        if (s) dy += 1;

        game?.updateCurrentUserMovement(dx, dy);
    };

    const changeAttackMode = (mode: EAttackMode) => {
        attackMode = mode;
    };

    useEffect(() => {
        game = new Game(server, store, {
            openItemShop: onOpenItemShop,
            closeItemShop: onCloseItemShop
        });
        canvas = Canvas({
            parentId: gameField,
            WIDTH: WINDOW.WIDTH,
            HEIGHT: WINDOW.HEIGHT,
            WINDOW,
            callbacks: {
                mouseMove: () => { },
                mouseClick,
                mouseRightClick,
            },
        });

        let animationFrame: number;

        const gameLoop = () => {
            handleMovement();
            animationFrame = requestAnimationFrame(gameLoop);
        };

        animationFrame = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(animationFrame);
            canvas?.destructor();
        };
    });

    useEffect(() => {
        const keyDownHandler = (event: KeyboardEvent) => {
            const keyCode = event.keyCode ? event.keyCode : event.which ? event.which : 0;
            if (useTypingState.isTyping) return;

            switch (keyCode) {
                case 65: // a
                    movementKeys.a = true
                    break
                case 68: // d
                    movementKeys.d = true
                    break
                case 87: // w
                    movementKeys.w = true
                    break
                case 83: // s
                    movementKeys.s = true
                    break;
                case 49:
                    changeAttackMode(EAttackMode.Sword);
                    break;
                case 50:
                    changeAttackMode(EAttackMode.Bow);
                    break;
                default:
                    break;
            }
        };

        const keyUpHandler = (event: KeyboardEvent) => {
            const keyCode = event.keyCode ? event.keyCode : event.which ? event.which : 0;

            switch (keyCode) {
                case 65: // a
                    movementKeys.a = false
                    break
                case 68: // d
                    movementKeys.d = false
                    break
                case 87: // w
                    movementKeys.w = false
                    break
                case 83: // s
                    movementKeys.s = false
                    break;
            }
        };

        const mouseDownHandler = (event: MouseEvent) => {
            if (event.button === 2) {
                event.preventDefault();
                game?.handleBlock();
            }
        };

        const mouseUpHandler = (event: MouseEvent) => {
            if (event.button === 2) {
                game?.handleUnblock();
            }
        };

        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        document.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        return () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            document.removeEventListener('mousedown', mouseDownHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
    });

    // выстреливает только при уничтожении компоненты
    useEffect(() => () => game?.destructor());

    return (<div id={gameField} className={gameField}></div>);
}

export default GameCanvas;