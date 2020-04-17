/*
 * 3DCycles - A lightcycle game.
 * Copyright (C) 2019-2020 Glen Harpring
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
 
class Team
{
	hasPlayer(id)
	{
		for(var i=this.members.length-1;i>=0;--i)
		{
			if(this.members[i] == id) return true;
		}
		return false;
	}
	spawn(respawn=true,update=true)
	{
		// Player 0 spawns in center, 1 on right, 2 on left, 3 on right, 4 on left, etc
		if(this.members.length > 0)
		{
			var t = cdir(this.dir);
			var addx = (t[0]*settings.SPAWN_WINGMEN_SIDE)+(t[1]*settings.SPAWN_WINGMEN_BACK),
				addy = (t[1]*settings.SPAWN_WINGMEN_SIDE)+(t[0]*settings.SPAWN_WINGMEN_BACK);
			this.members[0].spawn({
				x: this.x, y: this.y, z: this.z, dir: this.dir
			},respawn,update);
			for(var i=1;i<this.members.length;i+=2)
			{
				this.members[i].spawn({
					x: this.x+addx*(i/2), y: this.y+addy*(i/2), z: this.z, dir: this.dir
				},respawn,update);
				if(this.members[i+1])
				{
					this.members[i+1].spawn({
						x: this.x-addx*(i/2), y: this.y-addy*(i/2), z: this.z, dir: this.dir
					},respawn,update);
				}
			}
		}
	}
	constructor(cfg)
	{
		if(cfg.name == undefined) this.name = false;
		else this.name = ""+cfg.name;
		
		this.members = [];
		
		this.x = cfg.x||0; this.y = cfg.y||0; this.z = cfg.z||0;
		this.dir = cfg.dir||0;
	}
}

if(typeof(module) !== "undefined") module.exports = Team;
