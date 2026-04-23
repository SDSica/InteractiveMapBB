
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
        /*
        this.load.spritesheet('old_man_idle', 'TilesetMap.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        */
    }

    create() {
        this.objectsLabel = this.add.text(645, 480, '', {
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

        Object.values(this.objectsInteract).forEach(layer => {
            if (layer) layer.setTint(0x999999);
        });

        this.portrait = this.add.sprite(496, 472, 'portraits')
            .setOrigin(0.5)
            .setDepth(1001) // Above the UI
            .setScrollFactor(0)
            .setVisible(false); // Hidden by default

        // Back to map Button
        const backBtn = this.add.text(50, 10, ' <MAP', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#ffffff'
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
        /*this.anims.create({
            key: 'old_man_move',
            // Replace 500 and 501 with the actual indices of the two frames
            frames: this.anims.generateFrameNumbers('old_man_idle', { frames: [5106, 5026] }),
            frameRate: 2, // Slow toggle for an idle feel
            repeat: -1    // Loop forever
        });
        this.objectsInteract['Objects1'].setVisible(false);
        const oldManData = triggerLayer.objects.find(obj => obj.name === 'Objects1');
        if (oldManData) {
            const sprite = this.add.sprite(oldManData.x, oldManData.y, 'old_man_idle');
            sprite.setOrigin(0, 0); // Match Tiled's top-left origin
            sprite.play('old_man_move');
        }
            */
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

                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    this.objectsLabel.setText(props.displayName || zone.targetName);

                    // --- Highlight Logic ---

                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer) {
                        targetLayer.setTint(0xFFFFFF);
                    }

                });

                zone.on('pointerout', () => {
                    this.objectsLabel.setText('');
                    this.portrait.setVisible(false);

                    // Reset specific layer
                    const targetLayer = this.objectsInteract[zone.targetName];
                    if (targetLayer) {
                        targetLayer.setTint(0x999999);
                    }
                });

                zone.on('pointerdown', () => {
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
        // Tilesets - Add your other tileset images here
        this.load.image('tileset', 'TilesetMap.png');

        // The Tilemap JSON
        this.load.tilemapTiledJSON('overworld_map', 'OverworldMap.json');

        this.load.spritesheet('flag_anim', 'Assets/FlagsTileset.png', {
            frameWidth: 40, // Match your tile width
            frameHeight: 20 // Match your tile height
        });

    }

    create() {

        // 1. Initialize the Map
        const map = this.make.tilemap({ key: 'overworld_map' });
        //this.cameras.main.fadeIn(500, 0, 0, 0);
        //const vignette = this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.35);
        this.islandLabel = this.add.text(645, 480, '', {
            fontFamily: '"Press Start 2P"', // Standard "Retro" web stack
            fontSize: '10px',
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
            wordWrap: { width: 290, useAdvancedWrap: true }
        })
            .setOrigin(0.5)
            .setDepth(1000)
            .setScrollFactor(0);


        // 2. Add Tilesets 
        // Note: The first argument must EXACTLY match the name inside the Tiled editor
        // const otherTileset = map.addTilesetImage('OtherName', 'other_key'); 

        const tileset = map.addTilesetImage('TilesetMap', 'tileset');


        // 3. Static Background Layers
        map.createLayer('WaterLayer', tileset, 0, 0);
        map.createLayer('BorderLayer', tileset, 0, 0);
        map.createLayer('DialogueBox', tileset, 0, 0);


        // 4. All island layers here
        this.islands = {
            'Island1': map.createLayer('Island1', [tileset, 0, 0]),
            'Island1Front': map.createLayer('Island1Front', [tileset]),
            'Island2': map.createLayer('Island2', [tileset, 0, 0]),
            'Island2Front': map.createLayer('Island2Front', [tileset]),
            'Island3': map.createLayer('Island3', [tileset, 0, 0]),
            'Island3Front': map.createLayer('Island3Front', [tileset]),
            'Island4': map.createLayer('Island4', [tileset, 0, 0]),
            'Island4Front': map.createLayer('Island4Front', [tileset]),
            'Island5': map.createLayer('Island5', [tileset, 0, 0]),
            'Island5Front': map.createLayer('Island5Front', [tileset]),
            'Island6': map.createLayer('Island6', [tileset, 0, 0]),
            'Island6Front': map.createLayer('Island6Front', [tileset]),
            'Island7': map.createLayer('Island7', [tileset, 0, 0]),
            'Island7Front': map.createLayer('Island7Front', [tileset]),

        };


        // Fit to Browser 
        this.cameras.main.setZoom(2);
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
        this.cameras.main.setBackgroundColor('#374647');

        Object.values(this.islands).forEach(layer => {
            if (layer) layer.setTint(0x999999);
        });

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

                    // --- UI Update ---

                    console.log("Hover detected for:", zone.targetName); //Debug
                    const rawProps = obj.properties || [];
                    const props = rawProps.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
                    this.islandLabel.setText(props.displayName || obj.name);

                    this.islandLabel.setVisible(true);
                    // --- Highlight Logic ---
                    // This loops through your islands object and highlights EVERYTHING 
                    // that starts with the target name (e.g., 'Island1' AND 'Island1Front')
                    for (const [layerName, layer] of Object.entries(this.islands)) {
                        if (layerName.startsWith(zone.targetName)) {
                            layer.setTint(0xFFFFFF); // Full brightness
                            layer.setAlpha(1); // Optional: if you want alpha changes too
                        }
                    }
                });

                zone.on('pointerout', () => {
                    this.islandLabel.setText('Select an Island!');

                    // --- Dim Logic ---
                    // Revert all related layers back to the dimmed state
                    for (const [layerName, layer] of Object.entries(this.islands)) {
                        if (layerName.startsWith(zone.targetName)) {
                            layer.setTint(0x999999);
                        }
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
    scene: [OverworldScene, IslandDetailScene]
};

const game = new Phaser.Game(config);
