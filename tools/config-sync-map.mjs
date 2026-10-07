/** Allow-listed public defaults copied from the private CoreToolsX plugin repository. */
export const SOURCE_REPOSITORY = 'IceWolf23X/CoreToolsX-plugin';
export const SOURCE_REF = 'main';

export const CONFIG_FILES = [
  { id: 'paper/config.yml', platform: 'Paper', format: 'yaml', source: 'src/main/resources/config.yml', target: 'synced-configs/paper/config.yml', article: 'paper/config-yml' },
  { id: 'paper/tool-upgrades.yml', platform: 'Paper', format: 'yaml', source: 'src/main/resources/tool-upgrades.yml', target: 'synced-configs/paper/tool-upgrades.yml', article: 'paper/tool-upgrades-yml' },
  { id: 'paper/tool-skins.yml', platform: 'Paper', format: 'yaml', source: 'src/main/resources/tool-skins.yml', target: 'synced-configs/paper/tool-skins.yml', article: 'paper/tool-skins-yml' },
  { id: 'paper/messages.yml', platform: 'Paper', format: 'yaml', source: 'src/main/resources/messages.yml', target: 'synced-configs/paper/messages.yml', article: 'paper/messages-yml' }
];
