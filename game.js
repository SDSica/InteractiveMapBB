
class IslandDetailScene extends Phaser.Scene {
    constructor() {
        super('IslandDetailScene');
    }

    init(data) {
        this.mapID = data.mapID; // e.g., 'Island1'

    }

    preload() {
        this.load.tilemapTiledJSON(this.mapID, `${this.mapID}.json`);
        this.load.image('tileset', 'TilesetMap.png');

        this.load.spritesheet('portraits', 'TilesetMap.png', {
            frameWidth: 32, // Adjust to the size of your portrait art
            frameHeight: 32
        });

    }

    create() {
        this.objectsLabel = this.add.text(460, 455, '', {
            fontFamily: '"Press Start 2P"', // Standard "Retro" web stack
            fontSize: '10px',
            fontStyle: 'normal',
            fill: '#000000',
            stroke: '#7a7878',
            strokeThickness: 0,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#676565',
                blur: 0,
                stroke: true,
                fill: true
            },
            align: 'center',
            wordWrap: { width: 200, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(1000)
            .setScrollFactor(0);

        this.cameras.main.fadeIn(500, 0, 0, 0);
        console.log(`Welcome to ${this.displayName}`);

        const map = this.make.tilemap({ key: this.mapID });
        const tileset = map.addTilesetImage('TilesetMap', 'tileset');

        map.createLayer('WaterLayer', tileset, 0, 0);
        map.createLayer('Borders', tileset, 0, 0);
        map.createLayer('Island', tileset, 0, 0);
        map.createLayer('DialogueBox', tileset, 0, 0);
        map.createLayer('Flora', tileset, 0, 0);
        map.createLayer('Structures', tileset, 0, 0);

        this.objectsInteract = {
            'Objects1': map.createLayer('Objects1', [tileset, 0, 0]),
            'Objects2': map.createLayer('Objects2', [tileset, 0, 0]),
            'Objects3': map.createLayer('Objects3', [tileset, 0, 0]),
            'Objects4': map.createLayer('Objects4', [tileset, 0, 0]),
            'Objects5': map.createLayer('Objects5', [tileset, 0, 0]),

        }

        this.activeGlows = {};
        Object.entries(this.objectsInteract).forEach(([key, layer]) => {
            if (layer) {
                layer.setTint(0xFFFFFF);

                this.activeGlows[key] = layer.postFX.addGlow(0xffffff, 2, 0);
                this.tweens.add({
                    targets: this.activeGlows[key],
                    outerStrength: 4, // Pulse from 2 to 4
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });


        this.portrait = this.add.sprite(370, 410, 'portraits')
            .setOrigin(0.5)
            .setDepth(1001) // Above the UI
            .setScrollFactor(0)
            .setVisible(false); // Hidden by default

        //Map Button -> CHANGE
        const backBtn = this.add.text(568, 280, ' <MAP', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#faf600',
            stroke: '#0e0d0d',
            strokeThickness: 1,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#676565',
                blur: 0,
                stroke: true,
                fill: true
            },
        }).setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {

                this.input.enabled = false;
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.start('OverworldScene');
                });
            });

        this.cameras.main.setZoom(2);
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
        this.cameras.main.setBackgroundColor('#374647');

        const triggerLayer = map.getObjectLayer('Triggers1');

        if (triggerLayer) {
            triggerLayer.objects.forEach(obj => {
                const zone = this.add.zone(obj.x, obj.y, obj.width, obj.height)
                    .setOrigin(0, 0)
                    .setInteractive(
                        new Phaser.Geom.Rectangle(0, 0, obj.width, obj.height),
                        Phaser.Geom.Rectangle.Contains
                    );

                zone.targetName = obj.name;

                zone.on('pointerover', () => {

                    this.portrait.setVisible(false);
                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    this.objectsLabel.setText(props.displayName || zone.targetName);

                    // --- Highlight Logic ---

                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer && this.activeGlows[zone.targetName]) {
                        targetLayer.postFX.remove(this.activeGlows[zone.targetName]);
                        this.activeGlows[zone.targetName] = null;


                    }

                });

                zone.on('pointerout', () => {


                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer && !this.activeGlows[zone.targetName]) {
                        targetLayer.setTint(0xFFFFFF);
                        this.activeGlows[zone.targetName] = targetLayer.postFX.addGlow(0xffffff, 2, 0);
                    }
                });

                zone.on('pointerdown', () => {
                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer) {
                        targetLayer.setTint(0x999999);
                    }

                    this.portrait.setVisible(false);
                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    if (props.dialogString) {

                        if (props.portraitFrame !== undefined) {
                            this.portrait.setFrame(props.portraitFrame);
                            this.portrait.setVisible(true);
                            this.tweens.add({
                                targets: this.portrait,
                                scale: { from: 0.5, to: 1 },
                                duration: 200,
                                ease: 'Back.easeOut'
                            });
                        } else {
                            this.portrait.setVisible(false); // Hide if it's just an object (like a sign)
                        }
                        // Update the label to show the full dialogue
                        this.objectsLabel.setText(props.dialogString);
                    }
                    if (props.url) window.open(props.url, '_blank');
                });

            });
        }
    }

}

class OverworldScene extends Phaser.Scene {
    constructor() {
        super('OverworldScene');
    }

    preload() {
        this.load.image('tileset', 'TilesetMap.png');
        this.load.tilemapTiledJSON('overworld_map', 'OverworldMap.json');
    }

    create() {
        const map = this.make.tilemap({ key: 'overworld_map' });
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.islandLabel = this.add.text(480, 455, '', {
            fontFamily: '"Press Start 2P"', // Standard "Retro" web stack
            fontSize: '15px',
            fontStyle: 'normal',
            fill: '#000000', // Crisp white text
            stroke: '#7a7878', // Heavy outline to mimic shadows
            strokeThickness: 0,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#676565',
                blur: 0,
                stroke: true,
                fill: true
            },
            align: 'center',
            wordWrap: { width: 250, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(1000)
            .setScrollFactor(0);


        const tileset = map.addTilesetImage('TilesetMap', 'tileset');

        map.createLayer('WaterLayer', tileset, 0, 0);
        map.createLayer('BorderLayer', tileset, 0, 0);
        map.createLayer('DialogueBox', tileset, 0, 0)

        this.islands = {
            'Island1': map.createLayer('Island1', [tileset, 0, 0]),
            'Island2': map.createLayer('Island2', [tileset, 0, 0]),
            'Island3': map.createLayer('Island3', [tileset, 0, 0]),
            'Island4': map.createLayer('Island4', [tileset, 0, 0]),
            'Island5': map.createLayer('Island5', [tileset, 0, 0]),
            'Island6': map.createLayer('Island6', [tileset, 0, 0]),
            'Island7': map.createLayer('Island7', [tileset, 0, 0]),
        };

        map.createLayer('Island1Front', tileset, 0, 0)
        map.createLayer('Island2Front', tileset, 0, 0)
        map.createLayer('Island3Front', tileset, 0, 0)
        map.createLayer('Island4Front', tileset, 0, 0)
        map.createLayer('Island5Front', tileset, 0, 0)
        map.createLayer('Island6Front', tileset, 0, 0)
        map.createLayer('Island7Front', tileset, 0, 0)

        this.activeGlows = {};
        Object.entries(this.islands).forEach(([key, layer]) => {
            if (layer) {
                layer.setTint(0xFFFFFF);
                this.activeGlows[key] = layer.postFX.addGlow(0xffffff, 2, 0);
                this.tweens.add({
                    targets: this.activeGlows[key],
                    outerStrength: 4,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.cameras.main.setZoom(2);
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
        this.cameras.main.setBackgroundColor('#374647');

        const triggerLayer = map.getObjectLayer('Triggers');
        if (triggerLayer) {
            triggerLayer.objects.forEach(obj => {
                const zone = this.add.zone(obj.x, obj.y, obj.width, obj.height)
                    .setOrigin(0, 0)
                    .setInteractive(
                        new Phaser.Geom.Rectangle(0, 0, obj.width, obj.height),
                        Phaser.Geom.Rectangle.Contains
                    );

                zone.targetName = obj.name;
                zone.on('pointerover', () => {

                    //console.log("Hover detected for:", zone.targetName); //Debug
                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    this.islandLabel.setText(props.displayName || obj.name);

                    this.islandLabel.setVisible(true);
                    const targetLayer = this.islands[zone.targetName];
                    if (targetLayer && this.activeGlows[zone.targetName]) {
                        targetLayer.postFX.remove(this.activeGlows[zone.targetName]);
                        this.activeGlows[zone.targetName] = null;
                    }
                });

                zone.on('pointerout', () => {
                    const targetLayer = this.islands[zone.targetName];
                    if (targetLayer && !this.activeGlows[zone.targetName]) {
                        targetLayer.setTint(0xFFFFFF);
                        this.activeGlows[zone.targetName] = targetLayer.postFX.addGlow(0xffffff, 2, 0);
                    }
                });

                zone.on('pointerdown', () => {
                    this.input.enabled = false;
                    this.cameras.main.fadeOut(500, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start('IslandDetailScene', { mapID: zone.targetName });
                    });
                });
            });
        }
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        this.load.tilemapTiledJSON('startscene_map', 'StartScene.json');
        this.load.image('tileset', 'TilesetMap.png');
        

        this.load.spritesheet('portraits', 'TilesetMap.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }
    create() {

        this.isIntroActive = true;

        this.introDialogue = this.add.text(645, 340, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '27px',
            fontStyle: 'normal',
            fill: '#000000',
            stroke: '#7a7878',
            strokeThickness: 0,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#676565',
                blur: 0,
                stroke: true,
                fill: true
            },
            align: 'center',
            wordWrap: { width: 550, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(2001)
            .setScrollFactor(0);
        this.objectsLabel = this.add.text(460, 455, '', {
            fontFamily: '"Press Start 2P"', // Standard "Retro" web stack
            fontSize: '10px',
            fontStyle: 'normal',
            fill: '#000000',
            stroke: '#7a7878',
            strokeThickness: 0,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#676565',
                blur: 0,
                stroke: true,
                fill: true
            },
            align: 'center',
            wordWrap: { width: 250, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(1000)
            .setScrollFactor(0);

        this.cameras.main.fadeIn(500, 0, 0, 0);

        const map = this.make.tilemap({ key: 'startscene_map' });
        const tileset = map.addTilesetImage('TilesetMap', 'tileset');
        

        //Statische Layer
        map.createLayer('WaterLayer', tileset, 0, 0);
        map.createLayer('BorderLayer', tileset, 0, 0);
        map.createLayer('Island', tileset, 0, 0);
        map.createLayer('Structures', tileset, 0, 0);
        map.createLayer('Flora', tileset, 0, 0);
        map.createLayer('DialogueBox2', tileset, 0, 0);
        

        //Intro Dialog Layer
        this.dialogueInteract = {
            'ButtonLayer': map.createLayer('ButtonLayer', [tileset], 0, 0).setDepth(2000),
            'DialogueBox': map.createLayer('DialogueBox', [tileset], 0, 0).setDepth(1999)
        }
        this.introDialogue.setText("Welcome! Click to start your journey lorem ipsum");

        //Interaktive Layer
        this.objectsInteract = {
            'Objects1': map.createLayer('Objects1', [tileset, 0, 0]),
            'Objects2': map.createLayer('Objects2', [tileset, 0, 0]),
        }

        this.activeGlows = {};
        Object.entries(this.objectsInteract).forEach(([key, layer]) => {
            if (layer) {
                layer.setTint(0xFFFFFF);

                this.activeGlows[key] = layer.postFX.addGlow(0xffffff, 2, 0);
                this.tweens.add({
                    targets: this.activeGlows[key],
                    outerStrength: 4, // Pulse from 2 to 4
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.portrait = this.add.sprite(496, 472, 'portraits')
            .setOrigin(0.5)
            .setDepth(1001)
            .setScrollFactor(0)
            .setVisible(false);

        this.cameras.main.setZoom(2);
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
        this.cameras.main.setBackgroundColor('#374647');

        const triggerLayer = map.getObjectLayer('Triggers');

        if (triggerLayer) {
            triggerLayer.objects.forEach(obj => {
                const zone = this.add.zone(obj.x, obj.y, obj.width, obj.height)
                    .setOrigin(0, 0)
                    .setInteractive(
                        new Phaser.Geom.Rectangle(0, 0, obj.width, obj.height),
                        Phaser.Geom.Rectangle.Contains
                    );

                zone.targetName = obj.name;

                zone.on('pointerover', () => {
                    if (this.isIntroActive) return;
                    this.portrait.setVisible(false);

                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    this.objectsLabel.setText(props.displayName || zone.targetName);

                    // --- Highlight Logic ---

                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer && this.activeGlows[zone.targetName]) {
                        targetLayer.postFX.remove(this.activeGlows[zone.targetName]);
                        this.activeGlows[zone.targetName] = null;

                    }
                });

                zone.on('pointerout', () => {

                    if (this.isIntroActive) return;
                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer && !this.activeGlows[zone.targetName]) {
                        targetLayer.setTint(0xFFFFFF);
                        this.activeGlows[zone.targetName] = targetLayer.postFX.addGlow(0xffffff, 2, 0);
                    }
                });

                zone.on('pointerdown', () => {
                    if (zone.targetName === 'StartButton') {

                        this.closeIntro();
                        return;
                    }
                    if (zone.targetName === 'Objects2') {
                        this.input.enabled = false;
                        this.cameras.main.fadeOut(500, 0, 0, 0);
                        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                            this.scene.start('OverworldScene');
                        });
                    }

                    if (this.isIntroActive) return;

                    this.portrait.setVisible(false);
                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    if (props.dialogString) {

                        if (props.portraitFrame !== undefined) {
                            this.portrait.setFrame(props.portraitFrame);
                            this.portrait.setVisible(true);
                            this.tweens.add({
                                targets: this.portrait,
                                scale: { from: 0.5, to: 1 },
                                duration: 200,
                                ease: 'Back.easeOut'
                            });
                        } else {
                            this.portrait.setVisible(false); // Hide if it's just an object (like a sign)
                        }
                        // Update the label to show the full dialogue
                        this.objectsLabel.setText(props.dialogString);
                    }
                    if (props.url) window.open(props.url, '_blank');
                });

            });
        }
    }

    closeIntro() {
        this.isIntroActive = false;
        this.introDialogue.setText('');

        Object.values(this.dialogueInteract).forEach(layer => {
            this.tweens.add({
                targets: layer,
                alpha: 0,
                duration: 500,
                onComplete: () => layer.setVisible(false)
            });
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    scale: {
        mode: Phaser.Scale.FIT, // Scaled to fit browser window
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [StartScene, OverworldScene, IslandDetailScene]
};

const game = new Phaser.Game(config);